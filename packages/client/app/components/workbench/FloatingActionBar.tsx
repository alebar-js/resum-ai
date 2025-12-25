import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Check, RotateCcw, RefreshCw, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAppStore } from "~/lib/store";
import { useRefactorData, useCreateJobPostingData, useUpdateJobPostingData } from "~/lib/queries";
import type { ResumeProfile } from "@app/shared";

export function FloatingActionBar() {
  const navigate = useNavigate();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  
  const diffData = useAppStore((state) => state.diffData);
  const keepChangesData = useAppStore((state) => state.keepChangesData);
  const undoChangesData = useAppStore((state) => state.undoChangesData);
  const jobDescription = useAppStore((state) => state.jobDescription);
  const startDiffReviewData = useAppStore((state) => state.startDiffReviewData);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const acceptChange = useAppStore((state) => state.acceptChange);

  const refactorMutation = useRefactorData();
  const createJobPostingMutation = useCreateJobPostingData();
  const updateJobPostingMutation = useUpdateJobPostingData();

  const handleKeep = useCallback(async () => {
    if (!diffData.resolved || !diffData.original || !diffData.refactored || updateJobPostingMutation.isPending) return;
    
    // Create a merged acceptedChanges object where all pending changes are accepted
    // This ensures all changes are included when "Keep" is clicked
    const mergedAcceptedChanges: Record<string, boolean> = { ...diffData.acceptedChanges };
    
    // Collect all possible change paths and accept pending ones
    const allChangePaths = new Set<string>();
    
    // Basics changes
    const basicsFields = ["name", "label", "email", "phone", "url", "location"];
    basicsFields.forEach(field => {
      allChangePaths.add(`basics.${field}`);
    });
    
    // Work changes - need to check both original and refactored
    const workMap = new Map(
      [
        ...(diffData.original.work || []).map(j => [j.id, j] as [string, typeof j]),
        ...(diffData.refactored.work || []).map(j => [j.id, j] as [string, typeof j])
      ]
    );
    workMap.forEach((job, id) => {
      allChangePaths.add(`work.${id}`);
      ["company", "position", "startDate", "endDate", "highlights"].forEach(field => {
        allChangePaths.add(`work.${id}.${field}`);
      });
    });
    
    // Skills changes
    const skillMap = new Map(
      [
        ...(diffData.original.skills || []).map(s => [s.name, s] as [string, typeof s]),
        ...(diffData.refactored.skills || []).map(s => [s.name, s] as [string, typeof s])
      ]
    );
    skillMap.forEach((skill, name) => {
      allChangePaths.add(`skills.${name}`);
      allChangePaths.add(`skills.${name}.keywords`);
    });
    
    // Accept all pending changes (those not explicitly rejected)
    allChangePaths.forEach(path => {
      if (mergedAcceptedChanges[path] === undefined) {
        mergedAcceptedChanges[path] = true;
      }
    });
    
    // Import mergeResumeData function (we'll need to export it or compute merge here)
    // For now, let's accept all changes in the store, then use the resolved data
    allChangePaths.forEach(path => {
      if (diffData.acceptedChanges[path] === undefined) {
        acceptChange(path);
      }
    });
    
    // Compute merged data with all pending changes accepted
    const merged = mergeResumeDataWithAcceptedChanges(
      diffData.original,
      diffData.refactored,
      mergedAcceptedChanges
    );
    
    // If we have an active job posting, update it directly
    if (activeJobPostingId) {
      try {
        await updateJobPostingMutation.mutateAsync({
          id: activeJobPostingId,
          data: {
            data: merged,
            status: "READY",
          },
        });
        keepChangesData();
      } catch (error) {
        console.error("Failed to save changes:", error);
        // Error is already displayed in the UI via updateJobPostingMutation.isError
      }
    } else {
      // Show save dialog to create a new job posting
      setShowSaveDialog(true);
    }
  }, [activeJobPostingId, diffData, keepChangesData, updateJobPostingMutation, acceptChange]);
  
  // Helper function to merge resume data (duplicated from DiffEditor for use here)
  function mergeResumeDataWithAcceptedChanges(
    original: ResumeProfile,
    refactored: ResumeProfile,
    acceptedChanges: Record<string, boolean>
  ): ResumeProfile {
    const merged = { ...original };
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
    const mergedWork: typeof original.work = [];
    
    // Process existing jobs
    for (const [id, origJob] of workMap) {
      const refJob = refactoredWorkMap.get(id);
      if (!refJob) {
        if (!isRejected(`work.${id}`)) {
          mergedWork.push({ ...origJob });
        }
      } else {
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
    const mergedSkills: typeof original.skills = [];
    
    for (const [name, origSkill] of skillMap) {
      const refSkill = refactoredSkillMap.get(name);
      if (!refSkill) {
        if (!isRejected(`skills.${name}`)) {
          mergedSkills.push({ ...origSkill });
        }
      } else {
        const mergedSkill = { ...origSkill };
        if (isAccepted(`skills.${name}.keywords`)) mergedSkill.keywords = refSkill.keywords;
        mergedSkills.push(mergedSkill);
      }
    }
    
    for (const [name, refSkill] of refactoredSkillMap) {
      if (!skillMap.has(name) && isAccepted(`skills.${name}`)) {
        mergedSkills.push({ ...refSkill });
      }
    }
    
    merged.skills = mergedSkills;
    merged.education = [...original.education];
    merged.projects = original.projects || [];
    
    return merged;
  }

  const handleSaveFork = useCallback(async () => {
    if (!forkTitle.trim() || !diffData.resolved) return;

    try {
      const newJobPosting = await createJobPostingMutation.mutateAsync({
        title: forkTitle,
        jobDescription: jobDescription,
        data: diffData.resolved,
      });
      
      navigate(`/job-posting/${newJobPosting.id}`);
      keepChangesData();
      setShowSaveDialog(false);
      setForkTitle("");
    } catch (error) {
      console.error("Failed to save job posting:", error);
    }
  }, [forkTitle, jobDescription, diffData.resolved, createJobPostingMutation, navigate, keepChangesData]);

  const handleUndo = useCallback(() => {
    undoChangesData();
    setShowSaveDialog(false);
    setForkTitle("");
  }, [undoChangesData]);

  const handleRegenerate = useCallback(async () => {
    if (!jobDescription.trim()) return;
    
    try {
      const result = await refactorMutation.mutateAsync({ jobDescription });
      startDiffReviewData(result.original, result.refactored);
    } catch (error) {
      console.error("Regenerate failed:", error);
    }
  }, [jobDescription, refactorMutation, startDiffReviewData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!diffData.isReviewing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input
      if (e.target instanceof HTMLInputElement) return;
      
      // Don't trigger shortcuts while saving
      if (updateJobPostingMutation.isPending) return;
      
      // Escape to undo
      if (e.key === "Escape") {
        e.preventDefault();
        handleUndo();
      }
      // Cmd/Ctrl + Enter to keep
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleKeep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diffData.isReviewing, handleKeep, handleUndo, updateJobPostingMutation.isPending]);

  if (!diffData.isReviewing) return null;

  // Show save dialog
  if (showSaveDialog) {
    return (
      <div className="p-4 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Job posting name (e.g., Meta - Sr. Engineer)"
              value={forkTitle}
              onChange={(e) => setForkTitle(e.target.value)}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && forkTitle.trim()) {
                  handleSaveFork();
                }
                if (e.key === "Escape") {
                  setShowSaveDialog(false);
                }
              }}
            />
            <Button
              onClick={handleSaveFork}
              disabled={!forkTitle.trim() || createJobPostingMutation.isPending}
              className="gap-2"
            >
              {createJobPostingMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Job Posting
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
          </div>
          {/* Error state for create job posting mutation */}
          {createJobPostingMutation.isError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-1">Failed to save job posting</p>
              <p className="text-xs text-destructive/80">
                {createJobPostingMutation.error instanceof Error
                  ? createJobPostingMutation.error.message
                  : "An unexpected error occurred. Please try again."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleUndo} 
            disabled={updateJobPostingMutation.isPending}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Undo
            <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd>
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleRegenerate}
            disabled={refactorMutation.isPending || updateJobPostingMutation.isPending}
            className="gap-2"
          >
            {refactorMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleKeep} 
            disabled={updateJobPostingMutation.isPending}
            className="gap-2"
          >
            {updateJobPostingMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Keep
                <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">⌘↵</kbd>
              </>
            )}
          </Button>
        </div>
        
        {/* Error states for mutations */}
        {(refactorMutation.isError || updateJobPostingMutation.isError) && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium mb-1">
              {refactorMutation.isError ? "Failed to regenerate" : "Failed to save changes"}
            </p>
            <p className="text-xs text-destructive/80">
              {(refactorMutation.error || updateJobPostingMutation.error) instanceof Error
                ? (refactorMutation.error || updateJobPostingMutation.error)?.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
