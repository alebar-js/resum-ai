import { ModularResumeEditor } from "./ModularResumeEditor";
import { DiffEditor } from "./DiffEditor";
import { FloatingActionBar } from "./FloatingActionBar";
import { IngestDialog } from "../ingestion/IngestDialog";
import { useAppStore } from "~/lib/store";
import { useMasterResumeData, useUpdateMasterResumeData } from "~/lib/queries";
import { useJobPostingData, useUpdateJobPostingData } from "~/lib/queries";
import type { ResumeProfile } from "@app/shared";
import { Button } from "~/components/ui/button";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

// Default empty resume structure
const createEmptyResume = (): ResumeProfile => ({
  id: crypto.randomUUID(),
  basics: {
    name: "",
    label: "",
    email: "",
    phone: "",
  },
  work: [],
  education: [],
  skills: [],
  projects: [],
});

/**
 * ResumeWorkspace - Right pane for editing resume
 * 
 * This component contains:
 * - Resume editor
 * - Upload option (when editing master resume)
 * - Floating action bar (during diff review)
 */
export function ResumeWorkspace() {
  const [isIngestDialogOpen, setIsIngestDialogOpen] = useState(false);
  const viewMode = useAppStore((state) => state.viewMode);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const diffData = useAppStore((state) => state.diffData);
  const updateResolvedData = useAppStore((state) => state.updateResolvedData);
  
  const { data: masterResumeData, isLoading: masterLoading } = useMasterResumeData();
  const { data: jobPostingData, isLoading: jobPostingLoading } = useJobPostingData(activeJobPostingId);
  
  const updateMasterResumeMutation = useUpdateMasterResumeData();
  const updateJobPostingMutation = useUpdateJobPostingData();
  
  const isLoading = masterLoading || (activeJobPostingId && jobPostingLoading);
  
  // Determine current resume data
  const currentResumeData: ResumeProfile | null = diffData.isReviewing
    ? diffData.resolved
    : viewMode === "jobPosting" && jobPostingData?.data
    ? jobPostingData.data
    : masterResumeData?.data || null;
  
  const handleSave = useCallback(
    (data: ResumeProfile) => {
      if (diffData.isReviewing) {
        // In review mode, update resolved data (handled by FloatingActionBar)
        updateResolvedData(data);
      } else if (viewMode === "jobPosting" && activeJobPostingId) {
        updateJobPostingMutation.mutate({
          id: activeJobPostingId,
          data: { data },
        });
      } else {
        updateMasterResumeMutation.mutate({ data });
      }
    },
    [
      diffData.isReviewing,
      viewMode,
      activeJobPostingId,
      updateResolvedData,
      updateJobPostingMutation,
      updateMasterResumeMutation,
    ]
  );
  
  const handleCancel = useCallback(() => {
    // Reset to saved data (handled by ModularResumeEditor)
  }, []);

  // Show upload option when editing master resume (not in review mode)
  const showUploadOption = viewMode === "master" && !diffData.isReviewing;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading resume...</p>
      </div>
    );
  }
  
  // Show diff editor when in review mode
  if (diffData.isReviewing) {
    return (
      <>
        <div className="h-full flex flex-col bg-background overflow-hidden">
          <DiffEditor />
          <FloatingActionBar />
        </div>
      </>
    );
  }
  
  // Use empty resume if no data exists - show form immediately
  const resumeDataToEdit = currentResumeData || createEmptyResume();
  
  // Check if currently saving
  const isSaving = updateMasterResumeMutation.isPending || updateJobPostingMutation.isPending;
  
  return (
    <>
      <div className="h-full flex flex-col bg-background overflow-hidden">
        {/* Upload Option Banner - shown when editing master resume */}
        {showUploadOption && (
          <div className="flex-shrink-0 p-3 border-b border-border bg-card/50 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Upload or Update Resume</p>
              <p className="text-xs text-muted-foreground">
                Upload a PDF or DOCX file to automatically parse and populate your resume fields
              </p>
            </div>
            <Button
              onClick={() => setIsIngestDialogOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </Button>
          </div>
        )}
        
        {/* Resume Editor - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!currentResumeData && !showUploadOption && (
            <div className="flex-shrink-0 p-4 bg-accent/20 border-b border-accent/30">
              <p className="text-sm text-accent-foreground">
                Start filling out your resume below. Click "Save Changes" when ready.
              </p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <ModularResumeEditor 
              data={resumeDataToEdit} 
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
              hideBasicsAndEducation={viewMode === "jobPosting"}
            />
          </div>
        </div>
      </div>
      
      <IngestDialog
        open={isIngestDialogOpen}
        onOpenChange={setIsIngestDialogOpen}
      />
    </>
  );
}

