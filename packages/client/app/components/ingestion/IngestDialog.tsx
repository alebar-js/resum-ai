import { useState, useCallback } from "react";
import { Upload, Check, X, Loader2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { DropZone } from "./DropZone";
import { ModularResumeEditor } from "../workbench/ModularResumeEditor";
import { useIngestFile, useIngestText } from "~/lib/queries";
import { useUpdateMasterResumeData } from "~/lib/queries";
import type { ResumeProfile } from "@app/shared";

interface IngestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IngestStep = "upload" | "review" | "saving";

export function IngestDialog({ open, onOpenChange }: IngestDialogProps) {
  const [step, setStep] = useState<IngestStep>("upload");
  const [parsedProfile, setParsedProfile] = useState<ResumeProfile | null>(null);
  const [reviewProfile, setReviewProfile] = useState<ResumeProfile | null>(null);

  const ingestFileMutation = useIngestFile();
  const ingestTextMutation = useIngestText();
  const updateMasterResumeMutation = useUpdateMasterResumeData();

  const isProcessing = ingestFileMutation.isPending || ingestTextMutation.isPending;
  const isSaving = updateMasterResumeMutation.isPending;

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        const result = await ingestFileMutation.mutateAsync(file);
        setParsedProfile(result.profile);
        setReviewProfile(result.profile);
        setStep("review");
      } catch (error) {
        console.error("Failed to ingest file:", error);
        // Error is handled by mutation state
      }
    },
    [ingestFileMutation]
  );

  const handleTextSubmit = useCallback(
    async (text: string) => {
      try {
        const result = await ingestTextMutation.mutateAsync({ text });
        setParsedProfile(result.profile);
        setReviewProfile(result.profile);
        setStep("review");
      } catch (error) {
        console.error("Failed to ingest text:", error);
        // Error is handled by mutation state
      }
    },
    [ingestTextMutation]
  );

  const handleConfirm = useCallback(async () => {
    if (!reviewProfile) return;

    setStep("saving");
    try {
      await updateMasterResumeMutation.mutateAsync({ data: reviewProfile });
      // Reset and close
      setStep("upload");
      setParsedProfile(null);
      setReviewProfile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save resume:", error);
      // Stay on review step to allow retry
      setStep("review");
    }
  }, [reviewProfile, updateMasterResumeMutation, onOpenChange]);

  const handleCancel = useCallback(() => {
    setStep("upload");
    setParsedProfile(null);
    setReviewProfile(null);
    ingestFileMutation.reset();
    ingestTextMutation.reset();
  }, [ingestFileMutation, ingestTextMutation]);

  const handleClose = useCallback(() => {
    if (step === "saving") return; // Prevent closing while saving
    handleCancel();
    onOpenChange(false);
  }, [step, handleCancel, onOpenChange]);

  const error = ingestFileMutation.error || ingestTextMutation.error || updateMasterResumeMutation.error;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {step === "upload" && "Upload Resume"}
            {step === "review" && "Review Parsed Resume"}
            {step === "saving" && "Saving Resume"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload your resume file (PDF or DOCX) or paste the content as text. We'll extract and structure it for you."}
            {step === "review" &&
              "Review the parsed information below. You can edit any fields before saving."}
            {step === "saving" && "Saving your resume..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="flex-1 overflow-auto">
              <DropZone
                onFileSelect={handleFileSelect}
                onTextSubmit={handleTextSubmit}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Review Step */}
          {step === "review" && reviewProfile && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-auto">
                <ModularResumeEditor
                  data={reviewProfile}
                  onSave={(data) => setReviewProfile(data)}
                  onCancel={() => {}}
                  isSaving={false}
                />
              </div>
              <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {parsedProfile && JSON.stringify(reviewProfile) !== JSON.stringify(parsedProfile) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewProfile(parsedProfile)}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Original
                    </Button>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Review and edit the parsed information, then confirm to save
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm & Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Saving Step */}
          {step === "saving" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-lg font-medium">Saving your resume...</p>
                  <p className="text-sm text-muted-foreground">
                    This will only take a moment
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-1">
                {ingestFileMutation.error || ingestTextMutation.error
                  ? "Failed to parse resume"
                  : "Failed to save resume"}
              </p>
              <p className="text-xs text-destructive/80">
                {error instanceof Error ? error.message : "An unexpected error occurred"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

