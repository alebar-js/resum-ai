import { useMemo, useEffect, useState } from "react";
import { diffWords } from "diff";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";
import type { ResumeProfile, Job, Skill } from "@app/shared";
import { Check, X } from "lucide-react";
import { Button } from "~/components/ui/button";

// ============================================================================
// DIFF UTILITIES
// ============================================================================

type ChangeType = "unchanged" | "added" | "removed" | "modified";

interface FieldChange {
  field: string;
  oldValue: string | string[] | undefined;
  newValue: string | string[] | undefined;
  type: ChangeType;
}

interface SectionChange {
  section: string;
  changes: FieldChange[];
  type: ChangeType;
}

function compareStrings(a: string | undefined, b: string | undefined): ChangeType {
  const aVal = (a ?? "").trim();
  const bVal = (b ?? "").trim();
  // Normalize phone numbers and URLs for comparison
  const normalize = (str: string) => {
    // Remove common formatting characters for phone numbers
    return str.replace(/[\s\-\(\)]/g, '').toLowerCase();
  };
  const aNormalized = normalize(aVal);
  const bNormalized = normalize(bVal);
  
  if (aNormalized === bNormalized) return "unchanged";
  if (!aVal && bVal) return "added";
  if (aVal && !bVal) return "removed";
  return "modified";
}

function compareArrays(a: string[] | undefined, b: string[] | undefined): ChangeType {
  const aArr = a ?? [];
  const bArr = b ?? [];
  if (JSON.stringify(aArr) === JSON.stringify(bArr)) return "unchanged";
  if (aArr.length === 0 && bArr.length > 0) return "added";
  if (aArr.length > 0 && bArr.length === 0) return "removed";
  return "modified";
}

function computeBasicsChanges(
  original: ResumeProfile["basics"],
  refactored: ResumeProfile["basics"]
): FieldChange[] {
  const changes: FieldChange[] = [];

  const fields: (keyof ResumeProfile["basics"])[] = ["name", "label", "email", "phone", "url"];
  for (const field of fields) {
    const oldVal = original[field] as string | undefined;
    const newVal = refactored[field] as string | undefined;
    const type = compareStrings(oldVal, newVal);
    if (type !== "unchanged") {
      changes.push({ field, oldValue: oldVal, newValue: newVal, type });
    }
  }

  // Location
  const oldLoc = original.location;
  const newLoc = refactored.location;
  const oldLocStr = oldLoc ? `${oldLoc.city}, ${oldLoc.region}` : undefined;
  const newLocStr = newLoc ? `${newLoc.city}, ${newLoc.region}` : undefined;
  const locType = compareStrings(oldLocStr, newLocStr);
  if (locType !== "unchanged") {
    changes.push({ field: "location", oldValue: oldLocStr, newValue: newLocStr, type: locType });
  }

  return changes;
}

function computeJobChanges(
  original: Job[],
  refactored: Job[]
): { itemChanges: { id: string; company: string; changes: FieldChange[]; type: ChangeType }[] } {
  const itemChanges: { id: string; company: string; changes: FieldChange[]; type: ChangeType }[] = [];

  // Build maps by ID
  const originalMap = new Map(original.map((j) => [j.id, j]));
  const refactoredMap = new Map(refactored.map((j) => [j.id, j]));

  // Check for modified/unchanged
  for (const [id, refJob] of refactoredMap) {
    const origJob = originalMap.get(id);
    if (!origJob) {
      // New job
      itemChanges.push({
        id,
        company: refJob.company,
        changes: [],
        type: "added",
      });
    } else {
      // Compare fields
      const changes: FieldChange[] = [];
      const fields: (keyof Job)[] = ["company", "position", "startDate", "endDate"];
      for (const field of fields) {
        const oldVal = origJob[field] as string | undefined;
        const newVal = refJob[field] as string | undefined;
        const type = compareStrings(oldVal, newVal);
        if (type !== "unchanged") {
          changes.push({ field, oldValue: oldVal, newValue: newVal, type });
        }
      }

      // Compare highlights
      const highlightsType = compareArrays(origJob.highlights, refJob.highlights);
      if (highlightsType !== "unchanged") {
        changes.push({
          field: "highlights",
          oldValue: origJob.highlights,
          newValue: refJob.highlights,
          type: highlightsType,
        });
      }

      if (changes.length > 0) {
        itemChanges.push({
          id,
          company: refJob.company,
          changes,
          type: "modified",
        });
      }
    }
  }

  // Check for removed
  for (const [id, origJob] of originalMap) {
    if (!refactoredMap.has(id)) {
      itemChanges.push({
        id,
        company: origJob.company,
        changes: [],
        type: "removed",
      });
    }
  }

  return { itemChanges };
}

function computeSkillChanges(
  original: Skill[],
  refactored: Skill[]
): { itemChanges: { name: string; changes: FieldChange[]; type: ChangeType }[] } {
  const itemChanges: { name: string; changes: FieldChange[]; type: ChangeType }[] = [];

  // Use name as identifier
  const originalMap = new Map(original.map((s) => [s.name, s]));
  const refactoredMap = new Map(refactored.map((s) => [s.name, s]));

  for (const [name, refSkill] of refactoredMap) {
    const origSkill = originalMap.get(name);
    if (!origSkill) {
      itemChanges.push({ name, changes: [], type: "added" });
    } else {
      const type = compareArrays(origSkill.keywords, refSkill.keywords);
      if (type !== "unchanged") {
        itemChanges.push({
          name,
          changes: [{ field: "keywords", oldValue: origSkill.keywords, newValue: refSkill.keywords, type }],
          type: "modified",
        });
      }
    }
  }

  for (const [name] of originalMap) {
    if (!refactoredMap.has(name)) {
      itemChanges.push({ name, changes: [], type: "removed" });
    }
  }

  return { itemChanges };
}

// ============================================================================
// MERGE FUNCTION
// ============================================================================

/**
 * Merges original and refactored resume data based on accepted changes
 */
function mergeResumeData(
  original: ResumeProfile,
  refactored: ResumeProfile,
  acceptedChanges: Record<string, boolean>
): ResumeProfile {
  const merged = { ...original };

  // Helper to check if a change path is accepted
  const isAccepted = (path: string) => acceptedChanges[path] === true;
  const isRejected = (path: string) => acceptedChanges[path] === false;

  // Merge basics
  if (isAccepted("basics.name")) merged.basics.name = refactored.basics.name;
  if (isAccepted("basics.label")) merged.basics.label = refactored.basics.label;
  if (isAccepted("basics.email")) merged.basics.email = refactored.basics.email;
  if (isAccepted("basics.phone")) merged.basics.phone = refactored.basics.phone;
  if (isAccepted("basics.url")) merged.basics.url = refactored.basics.url;
  if (isAccepted("basics.location")) merged.basics.location = refactored.basics.location;

  // Merge work experience
  const workMap = new Map(original.work.map((j) => [j.id, j]));
  const refactoredWorkMap = new Map(refactored.work.map((j) => [j.id, j]));
  const mergedWork: Job[] = [];

  // Process existing jobs
  for (const [id, origJob] of workMap) {
    const refJob = refactoredWorkMap.get(id);
    if (!refJob) {
      // Job was removed - only include if not rejected
      if (!isRejected(`work.${id}`)) {
        mergedWork.push({ ...origJob });
      }
    } else {
      // Job exists in both - merge fields based on acceptance
      const mergedJob = { ...origJob };
      if (isAccepted(`work.${id}.company`)) mergedJob.company = refJob.company;
      if (isAccepted(`work.${id}.position`)) mergedJob.position = refJob.position;
      if (isAccepted(`work.${id}.startDate`)) mergedJob.startDate = refJob.startDate;
      if (isAccepted(`work.${id}.endDate`)) mergedJob.endDate = refJob.endDate;
      if (isAccepted(`work.${id}.highlights`)) mergedJob.highlights = refJob.highlights;
      mergedWork.push(mergedJob);
    }
  }

  // Add new jobs
  for (const [id, refJob] of refactoredWorkMap) {
    if (!workMap.has(id) && isAccepted(`work.${id}`)) {
      mergedWork.push({ ...refJob });
    }
  }

  merged.work = mergedWork;

  // Merge skills
  const skillMap = new Map(original.skills.map((s) => [s.name, s]));
  const refactoredSkillMap = new Map(refactored.skills.map((s) => [s.name, s]));
  const mergedSkills: Skill[] = [];

  // Process existing skills
  for (const [name, origSkill] of skillMap) {
    const refSkill = refactoredSkillMap.get(name);
    if (!refSkill) {
      // Skill was removed - only include if not rejected
      if (!isRejected(`skills.${name}`)) {
        mergedSkills.push({ ...origSkill });
      }
    } else {
      // Skill exists in both - merge keywords based on acceptance
      const mergedSkill = { ...origSkill };
      if (isAccepted(`skills.${name}.keywords`)) mergedSkill.keywords = refSkill.keywords;
      mergedSkills.push(mergedSkill);
    }
  }

  // Add new skills
  for (const [name, refSkill] of refactoredSkillMap) {
    if (!skillMap.has(name) && isAccepted(`skills.${name}`)) {
      mergedSkills.push({ ...refSkill });
    }
  }

  merged.skills = mergedSkills;

  // Merge education (similar pattern)
  const educationMap = new Map(original.education.map((e, i) => [`edu.${i}`, e]));
  const refactoredEducationMap = new Map(refactored.education.map((e, i) => [`edu.${i}`, e]));
  merged.education = [...original.education]; // For now, keep original education

  // Merge projects if they exist
  if (original.projects || refactored.projects) {
    merged.projects = original.projects || [];
  }

  return merged;
}

// ============================================================================
// DIFF VIEW COMPONENTS
// ============================================================================

interface DiffBadgeProps {
  type: ChangeType;
}

function DiffBadge({ type }: DiffBadgeProps) {
  if (type === "unchanged") return null;
  
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded",
        type === "added" && "bg-green-500/10 text-green-500/70 border border-green-500/20",
        type === "removed" && "bg-red-500/10 text-red-500/70 border border-red-500/20",
        type === "modified" && "bg-amber-500/10 text-amber-500/70 border border-amber-500/20"
      )}
    >
      {type}
    </span>
  );
}

// Helper to normalize hyphenated words for comparison
// This ensures "Front-end" and "Front--end" are treated the same
function normalizeHyphens(text: string): string {
  // Normalize different hyphen types and multiple hyphens
  return text
    .replace(/[\u2010-\u2015\u2212\u002D\uFE63\uFF0D]/g, '-') // Normalize all hyphen variants to standard hyphen
    .replace(/-+/g, '-'); // Collapse multiple hyphens to single
}

// Helper to render inline diff for a single string
function InlineTextDiff({ oldText, newText }: { oldText: string; newText: string }) {
  // Normalize both texts to handle hyphen variations
  const normalizedOld = normalizeHyphens(oldText);
  const normalizedNew = normalizeHyphens(newText);
  
  // If normalized versions are identical, no diff needed (only hyphen differences)
  if (normalizedOld === normalizedNew) {
    return (
      <div className="text-sm px-3 py-2 rounded bg-muted/20 font-mono border border-border/50">
        <span className="text-muted-foreground/60">{newText}</span>
      </div>
    );
  }
  
  // Use diffWords on normalized versions to avoid false positives from hyphen splitting
  // The diff will show actual content differences, not just hyphen variations
  const diff = diffWords(normalizedOld, normalizedNew, { ignoreWhitespace: true });
  
  return (
    <div className="text-sm px-3 py-2 rounded bg-muted/20 font-mono border border-border/50">
      {diff.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="bg-green-500/10 text-green-400/80">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-red-500/10 text-red-400/60 opacity-70">
              {part.value}
            </span>
          );
        }
        return <span key={i} className="text-muted-foreground/60">{part.value}</span>;
      })}
    </div>
  );
}

interface InlineTextDiffWithActionsProps {
  oldText: string;
  newText: string;
  baseChangePath: string;
}

interface InlineTextDiffWithActionsProps {
  oldText: string;
  newText: string;
  baseChangePath: string;
  onWordChangesCount?: (count: number) => void;
}

function InlineTextDiffWithActions({ oldText, newText, baseChangePath, onWordChangesCount }: InlineTextDiffWithActionsProps) {
  // Normalize both texts to handle hyphen variations
  const normalizedOld = normalizeHyphens(oldText);
  const normalizedNew = normalizeHyphens(newText);
  
  // If normalized versions are identical, no diff needed
  if (normalizedOld === normalizedNew) {
    if (onWordChangesCount) onWordChangesCount(0);
    return (
      <div className="text-sm px-3 py-2 rounded bg-muted/20 font-mono border border-border/50">
        <span className="text-muted-foreground/60">{newText}</span>
      </div>
    );
  }
  
  // Use diffWords to get word-level changes
  const diff = diffWords(normalizedOld, normalizedNew, { ignoreWhitespace: true });
  
  // Group adjacent additions and deletions together
  const groupedChanges: Array<{
    type: 'unchanged' | 'change';
    removed?: string;
    added?: string;
    unchanged?: string;
    changeIndex: number;
  }> = [];
  
  let changeIndex = 0;
  let i = 0;
  while (i < diff.length) {
    const part = diff[i];
    
    if (part.added || part.removed) {
      // Start of a change group - collect all adjacent additions/deletions
      const removed: string[] = [];
      const added: string[] = [];
      
      while (i < diff.length && (diff[i].added || diff[i].removed)) {
        if (diff[i].removed) {
          removed.push(diff[i].value);
        }
        if (diff[i].added) {
          added.push(diff[i].value);
        }
        i++;
      }
      
      groupedChanges.push({
        type: 'change',
        removed: removed.join(''),
        added: added.join(''),
        changeIndex: changeIndex++,
      });
    } else {
      // Unchanged text
      groupedChanges.push({
        type: 'unchanged',
        unchanged: part.value,
        changeIndex: -1,
      });
      i++;
    }
  }
  
  // Notify parent of word changes count
  useEffect(() => {
    if (onWordChangesCount) {
      onWordChangesCount(changeIndex);
    }
  }, [changeIndex, onWordChangesCount]);
  
  return (
    <div className="text-sm px-3 py-2 pr-12 rounded bg-muted/20 font-mono border border-border/50">
      {groupedChanges.map((group, idx) => {
        if (group.type === 'unchanged') {
          return (
            <span key={idx} className="text-muted-foreground/60">
              {group.unchanged}
            </span>
          );
        }
        
        // This is a change group - render with hover actions
        const changePath = `${baseChangePath}.word.${group.changeIndex}`;
        return (
          <WordChangeGroup
            key={idx}
            removed={group.removed || ''}
            added={group.added || ''}
            changePath={changePath}
          />
        );
      })}
    </div>
  );
}

interface WordChangeGroupProps {
  removed: string;
  added: string;
  changePath: string;
}

function WordChangeGroup({ removed, added, changePath }: WordChangeGroupProps) {
  const [isHovered, setIsHovered] = useState(false);
  const acceptedChanges = useAppStore((state) => state.diffData.acceptedChanges);
  const acceptChange = useAppStore((state) => state.acceptChange);
  const rejectChange = useAppStore((state) => state.rejectChange);
  const resetChangeDecision = useAppStore((state) => state.resetChangeDecision);
  
  const isAccepted = acceptedChanges[changePath] === true;
  const isRejected = acceptedChanges[changePath] === false;
  const isPending = acceptedChanges[changePath] === undefined;

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    acceptChange(changePath);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    rejectChange(changePath);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetChangeDecision(changePath);
  };

  return (
    <span
      className={cn(
        "relative inline-block group rounded px-1 pr-8 transition-colors cursor-pointer",
        isAccepted && "bg-green-500/15",
        isRejected && "bg-red-500/15",
        isPending && "hover:bg-muted/40"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {removed && (
        <span className={cn(
          "bg-red-500/10 text-red-400/60",
          isAccepted && "opacity-30 line-through", // When accepted, fade and strikethrough old text
          isRejected && "bg-red-500/20 text-red-300 font-medium" // When rejected, emphasize old text
        )}>
          {removed}
        </span>
      )}
      {added && (
        <span className={cn(
          "bg-green-500/10 text-green-400/80",
          isAccepted && "bg-green-500/20 text-green-300 font-medium", // When accepted, emphasize new text
          isRejected && "opacity-30 line-through" // When rejected, fade and strikethrough new text
        )}>
          {added}
        </span>
      )}
      {isHovered && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-card border border-border rounded shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
          {isPending ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAccept}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                title="Accept change (keep new)"
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReject}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                title="Reject change (keep old)"
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-6 px-1.5 text-xs"
              title="Reset decision"
            >
              Reset
            </Button>
          )}
        </span>
      )}
      {/* Show checkmark when accepted, even when not hovering */}
      {isAccepted && !isHovered && (
        <Check className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 z-0" />
      )}
      {/* Show X when rejected, even when not hovering */}
      {isRejected && !isHovered && (
        <X className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 z-0" />
      )}
    </span>
  );
}

interface HighlightDiffItemProps {
  oldText?: string;
  newText?: string;
  changePath: string;
  type: "modified" | "added" | "removed";
}

function HighlightDiffItem({ oldText, newText, changePath, type }: HighlightDiffItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [wordChangesCount, setWordChangesCount] = useState(0);
  const acceptedChanges = useAppStore((state) => state.diffData.acceptedChanges);
  const acceptChange = useAppStore((state) => state.acceptChange);
  const rejectChange = useAppStore((state) => state.rejectChange);
  const resetChangeDecision = useAppStore((state) => state.resetChangeDecision);
  
  const isAccepted = acceptedChanges[changePath] === true;
  const isRejected = acceptedChanges[changePath] === false;
  const isPending = acceptedChanges[changePath] === undefined;

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    acceptChange(changePath);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    rejectChange(changePath);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetChangeDecision(changePath);
  };

  // Check if all word-level changes have been reviewed (accepted or rejected)
  const allWordChangesReviewed = useMemo(() => {
    if (wordChangesCount === 0) return true; // No word changes means nothing to review
    for (let i = 0; i < wordChangesCount; i++) {
      const wordPath = `${changePath}.word.${i}`;
      const decision = acceptedChanges[wordPath];
      if (decision === undefined) {
        return false; // At least one word change is pending
      }
    }
    return true; // All word changes have been decided
  }, [wordChangesCount, changePath, acceptedChanges]);

  if (type === "modified" && oldText && newText) {
    return (
      <div
        className={cn(
          "relative group space-y-1.5 rounded-lg p-2 transition-colors",
          allWordChangesReviewed && "bg-green-500/5 border border-green-500/20"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="text-xs text-muted-foreground/50 uppercase tracking-wide">Modified</div>
        <InlineTextDiffWithActions 
          oldText={oldText} 
          newText={newText} 
          baseChangePath={changePath}
          onWordChangesCount={setWordChangesCount}
        />
        {/* Show "done reviewing" checkmark when all word changes are reviewed */}
        {allWordChangesReviewed && isHovered && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Check className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
    );
  }

  if (type === "removed" && oldText) {
    return (
      <div
        className={cn(
          "relative group text-sm bg-red-500/8 text-red-400/70 px-3 py-1.5 rounded border border-red-500/15 transition-colors",
          isRejected && "bg-red-500/12 border-red-500/25",
          isPending && "hover:bg-red-500/12"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-red-400/50 mr-1.5">−</span>
        <span className={cn("opacity-75", isRejected && "opacity-50")}>{oldText}</span>
        {(isHovered || !isPending) && (
          <div className="flex items-center gap-1 absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPending ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAccept}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  title="Accept change"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReject}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  title="Reject change"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-6 px-1.5 text-xs"
                title="Reset decision"
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === "added" && newText) {
    return (
      <div
        className={cn(
          "relative group text-sm bg-green-500/8 text-green-400/80 px-3 py-1.5 rounded border border-green-500/15 transition-colors",
          isAccepted && "bg-green-500/12 border-green-500/25",
          isPending && "hover:bg-green-500/12"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-green-400/60 mr-1.5">+</span>
        {newText}
        {(isHovered || !isPending) && (
          <div className="flex items-center gap-1 absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPending ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAccept}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  title="Accept change"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReject}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  title="Reject change"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-6 px-1.5 text-xs"
                title="Reset decision"
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

interface FieldDiffProps {
  change: FieldChange;
  changePath: string;
  section?: string;
  itemId?: string;
}

function FieldDiff({ change, changePath, section, itemId }: FieldDiffProps) {
  const acceptedChanges = useAppStore((state) => state.diffData.acceptedChanges);
  const acceptChange = useAppStore((state) => state.acceptChange);
  const rejectChange = useAppStore((state) => state.rejectChange);
  const resetChangeDecision = useAppStore((state) => state.resetChangeDecision);
  
  const isAccepted = acceptedChanges[changePath] === true;
  const isRejected = acceptedChanges[changePath] === false;
  const isPending = acceptedChanges[changePath] === undefined;

  const handleAccept = () => {
    acceptChange(changePath);
  };

  const handleReject = () => {
    rejectChange(changePath);
  };

  const handleReset = () => {
    resetChangeDecision(changePath);
  };

  const isArray = Array.isArray(change.oldValue) || Array.isArray(change.newValue);

  if (isArray) {
    const oldArr = (change.oldValue as string[] | undefined) ?? [];
    const newArr = (change.newValue as string[] | undefined) ?? [];

    // Find which items were purely removed, purely added, or potentially modified
    const removedItems = oldArr.filter((item) => !newArr.includes(item));
    const addedItems = newArr.filter((item) => !oldArr.includes(item));
    const unchangedItems = newArr.filter((item) => oldArr.includes(item));
    
    // Try to match similar items for inline diff
    const pairedChanges: Array<{ old: string; new: string; similarity: number }> = [];
    const unmatchedRemoved = new Set(removedItems);
    const unmatchedAdded = new Set(addedItems);
    
    // Simple similarity matching - find pairs with similar content
    for (const oldItem of removedItems) {
      let bestMatch = null;
      let bestSimilarity = 0;
      
      for (const newItem of addedItems) {
        if (unmatchedAdded.has(newItem)) {
          // Calculate simple similarity (common words / total words)
          const oldWords = oldItem.toLowerCase().split(/\s+/);
          const newWords = newItem.toLowerCase().split(/\s+/);
          const commonWords = oldWords.filter(w => newWords.includes(w)).length;
          const similarity = commonWords / Math.max(oldWords.length, newWords.length);
          
          if (similarity > bestSimilarity && similarity > 0.4) { // 40% threshold
            bestMatch = newItem;
            bestSimilarity = similarity;
          }
        }
      }
      
      if (bestMatch) {
        pairedChanges.push({ old: oldItem, new: bestMatch, similarity: bestSimilarity });
        unmatchedRemoved.delete(oldItem);
        unmatchedAdded.delete(bestMatch);
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {change.field}
          </span>
          <DiffBadge type={change.type} />
        </div>
        <div className="pl-4 space-y-2">
          {/* Show matched pairs with inline diff */}
          {pairedChanges.map((pair, i) => {
            // Find the index in the original array for the change path
            const oldIndex = oldArr.indexOf(pair.old);
            const highlightPath = itemId 
              ? `${section}.${itemId}.${change.field}.${oldIndex}`
              : `${changePath}.${oldIndex}`;
            return (
              <HighlightDiffItem
                key={`modified-${i}`}
                oldText={pair.old}
                newText={pair.new}
                changePath={highlightPath}
                type="modified"
              />
            );
          })}
          
          {/* Show purely removed items */}
          {Array.from(unmatchedRemoved).map((item, i) => {
            const oldIndex = oldArr.indexOf(item);
            const highlightPath = itemId 
              ? `${section}.${itemId}.${change.field}.${oldIndex}`
              : `${changePath}.removed.${i}`;
            return (
              <HighlightDiffItem
                key={`removed-${i}`}
                oldText={item}
                changePath={highlightPath}
                type="removed"
              />
            );
          })}
          
          {/* Show purely added items */}
          {Array.from(unmatchedAdded).map((item, i) => {
            const newIndex = newArr.indexOf(item);
            const highlightPath = itemId 
              ? `${section}.${itemId}.${change.field}.${newIndex}`
              : `${changePath}.added.${i}`;
            return (
              <HighlightDiffItem
                key={`added-${i}`}
                newText={item}
                changePath={highlightPath}
                type="added"
              />
            );
          })}
          
          {/* Show unchanged items */}
          {unchangedItems.map((item, i) => (
            <div key={`unchanged-${i}`} className="text-sm text-muted-foreground/50 px-3 py-1.5">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 py-1 rounded-lg p-2 transition-colors",
      isAccepted && "bg-green-500/5 border border-green-500/20",
      isRejected && "bg-red-500/5 border border-red-500/20",
      isPending && "hover:bg-muted/30"
    )}>
      <span className="text-sm font-medium text-muted-foreground capitalize min-w-[80px]">
        {change.field}
      </span>
      <div className="flex-1 space-y-1.5">
        {change.type === "removed" || change.type === "modified" ? (
          <div className={cn(
            "text-sm px-3 py-1.5 rounded border",
            isRejected ? "bg-red-500/8 text-red-400/70 border-red-500/15 opacity-75" : "bg-red-500/8 text-red-400/70 border-red-500/15 opacity-75"
          )}>
            {change.oldValue as string}
          </div>
        ) : null}
        {change.type === "added" || change.type === "modified" ? (
          <div className={cn(
            "text-sm px-3 py-1.5 rounded border",
            isAccepted ? "bg-green-500/12 text-green-400/90 border-green-500/25" : "bg-green-500/8 text-green-400/80 border-green-500/15"
          )}>
            {change.newValue as string}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isPending ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAccept}
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
              title="Accept change"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
              title="Reject change"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-7 px-2 text-xs"
            title="Reset decision"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

interface JsonDiffViewProps {
  original: ResumeProfile;
  refactored: ResumeProfile;
}

function JsonDiffView({ original, refactored }: JsonDiffViewProps) {
  const diffData = useAppStore((state) => state.diffData);
  const updateResolvedData = useAppStore((state) => state.updateResolvedData);

  const basicsChanges = useMemo(
    () => computeBasicsChanges(original.basics, refactored.basics),
    [original.basics, refactored.basics]
  );

  const workChanges = useMemo(
    () => computeJobChanges(original.work, refactored.work),
    [original.work, refactored.work]
  );

  const skillChanges = useMemo(
    () => computeSkillChanges(original.skills, refactored.skills),
    [original.skills, refactored.skills]
  );

  // Auto-update resolved data when accepted changes change
  useEffect(() => {
    if (!original || !refactored) return;
    const merged = mergeResumeData(original, refactored, diffData.acceptedChanges);
    updateResolvedData(merged);
  }, [original, refactored, diffData.acceptedChanges, updateResolvedData]);

  const hasChanges =
    basicsChanges.length > 0 ||
    workChanges.itemChanges.length > 0 ||
    skillChanges.itemChanges.length > 0;

  if (!hasChanges) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">No changes detected</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Basics Changes */}
      {basicsChanges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Basics</h3>
            <DiffBadge type="modified" />
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            {basicsChanges.map((change, i) => (
              <FieldDiff 
                key={i} 
                change={change} 
                changePath={`basics.${change.field}`}
                section="basics"
              />
            ))}
          </div>
        </section>
      )}

      {/* Work Experience Changes */}
      {workChanges.itemChanges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Work Experience</h3>
          </div>
          <div className="space-y-4">
            {workChanges.itemChanges.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "bg-card border rounded-lg p-4",
                  item.type === "added" && "border-green-500/20",
                  item.type === "removed" && "border-red-500/20",
                  item.type === "modified" && "border-amber-500/20"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium">{item.company}</span>
                  <DiffBadge type={item.type} />
                </div>
                {item.changes.length > 0 && (
                  <div className="space-y-2">
                    {item.changes.map((change, i) => (
                      <FieldDiff 
                        key={i} 
                        change={change} 
                        changePath={`work.${item.id}.${change.field}`}
                        section="work"
                        itemId={item.id}
                      />
                    ))}
                  </div>
                )}
                {item.type === "added" && (
                  <div className="mt-2">
                    <FieldDiff 
                      change={{
                        field: "job",
                        oldValue: undefined,
                        newValue: "New job entry",
                        type: "added"
                      }}
                      changePath={`work.${item.id}`}
                      section="work"
                      itemId={item.id}
                    />
                  </div>
                )}
                {item.type === "removed" && (
                  <div className="mt-2">
                    <FieldDiff 
                      change={{
                        field: "job",
                        oldValue: "Job entry",
                        newValue: undefined,
                        type: "removed"
                      }}
                      changePath={`work.${item.id}`}
                      section="work"
                      itemId={item.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills Changes */}
      {skillChanges.itemChanges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Skills</h3>
          </div>
          <div className="space-y-4">
            {skillChanges.itemChanges.map((item) => (
              <div
                key={item.name}
                className={cn(
                  "bg-card border rounded-lg p-4",
                  item.type === "added" && "border-green-500/20",
                  item.type === "removed" && "border-red-500/20",
                  item.type === "modified" && "border-amber-500/20"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium">{item.name}</span>
                  <DiffBadge type={item.type} />
                </div>
                {item.changes.length > 0 && (
                  <div className="space-y-2">
                    {item.changes.map((change, i) => (
                      <FieldDiff 
                        key={i} 
                        change={change} 
                        changePath={`skills.${item.name}.${change.field}`}
                        section="skills"
                      />
                    ))}
                  </div>
                )}
                {item.type === "added" && (
                  <div className="mt-2">
                    <FieldDiff 
                      change={{
                        field: "skill",
                        oldValue: undefined,
                        newValue: "New skill",
                        type: "added"
                      }}
                      changePath={`skills.${item.name}`}
                      section="skills"
                    />
                  </div>
                )}
                {item.type === "removed" && (
                  <div className="mt-2">
                    <FieldDiff 
                      change={{
                        field: "skill",
                        oldValue: "Skill entry",
                        newValue: undefined,
                        type: "removed"
                      }}
                      changePath={`skills.${item.name}`}
                      section="skills"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiffEditor() {
  const diffData = useAppStore((state) => state.diffData);

  // Only show when in review mode with valid data
  if (!diffData.isReviewing || !diffData.original || !diffData.refactored) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold">Review Changes</h2>
        <p className="text-sm text-muted-foreground">
          Compare the original resume with the AI-refactored version
        </p>
      </div>

      {/* Diff View */}
      <JsonDiffView original={diffData.original} refactored={diffData.refactored} />
    </div>
  );
}
