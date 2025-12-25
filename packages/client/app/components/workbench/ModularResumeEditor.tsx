import { useState, useCallback, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronDown, ChevronRight, Save, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { ResumeProfile } from "@app/shared";
import { BasicsForm } from "./forms/BasicsForm";
import { WorkExperienceForm } from "./forms/WorkExperienceForm";
import { SkillsForm } from "./forms/SkillsForm";
import { EducationForm } from "./forms/EducationForm";
import { ProjectsForm } from "./forms/ProjectsForm";

interface ModularResumeEditorProps {
  data: ResumeProfile;
  onSave: (data: ResumeProfile) => void;
  onCancel: () => void;
  isSaving?: boolean;
  hideBasicsAndEducation?: boolean; // Hide these sections when adapting for job postings
}

export function ModularResumeEditor({ data, onSave, onCancel, isSaving = false, hideBasicsAndEducation = false }: ModularResumeEditorProps) {
  // Local state to track edits immediately for responsive UI
  const [localData, setLocalData] = useState<ResumeProfile>(data);
  
  // Track if a save has ever occurred
  const [hasSaved, setHasSaved] = useState(false);
  
  // Sync local state when prop changes externally (after save)
  useEffect(() => {
    setLocalData(data);
    // If data changed from outside (successful save), mark as saved
    if (hasSaved || JSON.stringify(localData) !== JSON.stringify(data)) {
      setHasSaved(true);
    }
  }, [data]);

  // Track if there are unsaved changes
  const isDirty = JSON.stringify(localData) !== JSON.stringify(data);

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(hideBasicsAndEducation ? ["work"] : ["basics"])
  );

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateField = useCallback(
    <K extends keyof ResumeProfile>(field: K, value: ResumeProfile[K]) => {
      const updated = { ...localData, [field]: value };
      setLocalData(updated); // Update local state immediately
    },
    [localData]
  );

  const handleSave = () => {
    onSave(localData);
    setHasSaved(true);
  };

  const handleCancel = () => {
    setLocalData(data); // Reset to saved data
    onCancel();
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {/* Basics Section */}
      {!hideBasicsAndEducation && (
        <Collapsible
        open={openSections.has("basics")}
        onOpenChange={() => toggleSection("basics")}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors border border-accent/30">
          <h2 className="text-lg font-semibold text-accent-foreground">Basics</h2>
          {openSections.has("basics") ? (
            <ChevronDown className="h-5 w-5 text-accent-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-accent-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <BasicsForm
            data={localData.basics}
            onChange={(basics) => updateField("basics", basics)}
          />
        </CollapsibleContent>
      </Collapsible>
    )}

      {/* Work Experience Section */}
      <Collapsible
        open={openSections.has("work")}
        onOpenChange={() => toggleSection("work")}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors border border-accent/30">
          <h2 className="text-lg font-semibold text-accent-foreground">
            Work Experience ({localData.work.length})
          </h2>
          {openSections.has("work") ? (
            <ChevronDown className="h-5 w-5 text-accent-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-accent-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <WorkExperienceForm
            jobs={localData.work}
            onChange={(work) => updateField("work", work)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Skills Section */}
      <Collapsible
        open={openSections.has("skills")}
        onOpenChange={() => toggleSection("skills")}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors border border-accent/30">
          <h2 className="text-lg font-semibold text-accent-foreground">
            Skills ({localData.skills.length})
          </h2>
          {openSections.has("skills") ? (
            <ChevronDown className="h-5 w-5 text-accent-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-accent-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <SkillsForm
            skills={localData.skills}
            onChange={(skills) => updateField("skills", skills)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Education Section - hidden when adapting for job postings */}
      {!hideBasicsAndEducation && (
        <Collapsible
          open={openSections.has("education")}
          onOpenChange={() => toggleSection("education")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors border border-accent/30">
            <h2 className="text-lg font-semibold text-accent-foreground">
              Education ({localData.education.length})
            </h2>
            {openSections.has("education") ? (
              <ChevronDown className="h-5 w-5 text-accent-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-accent-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <EducationForm
              education={localData.education}
              onChange={(education) => updateField("education", education)}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Projects Section */}
      <Collapsible
        open={openSections.has("projects")}
        onOpenChange={() => toggleSection("projects")}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors border border-accent/30">
          <h2 className="text-lg font-semibold text-accent-foreground">
            Projects ({localData.projects?.length || 0})
          </h2>
          {openSections.has("projects") ? (
            <ChevronDown className="h-5 w-5 text-accent-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-accent-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <ProjectsForm
            projects={localData.projects || []}
            onChange={(projects) => updateField("projects", projects)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Save/Cancel Footer */}
      <div className="sticky bottom-0 mt-6 p-4 bg-card border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isDirty ? "You have unsaved changes" : hasSaved ? "All changes saved" : ""}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

