import { useState, useEffect, useRef } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { useAppStore } from "~/lib/store";
import { useJobPostingData, useUpdateJobPostingData } from "~/lib/queries";
import { useDebouncedValue } from "~/lib/hooks/use-debounced-value";
import { Loader2, ExternalLink } from "lucide-react";

/**
 * JobDescriptionPanel - Left pane for displaying and editing job description
 * 
 * Features:
 * - Editable textarea that takes full height
 * - Auto-saves after user stops typing (debounced)
 * - Displays current job posting description
 * 
 * Future enhancements:
 * - Keyword extraction and highlighting
 * - Coverage indicators (green/yellow/red)
 * - Section collapsing
 * - JD reference IDs
 */
export function JobDescriptionPanel() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const { data: jobPostingData, isLoading } = useJobPostingData(activeJobPostingId);
  const updateJobPostingMutation = useUpdateJobPostingData();
  
  // Initialize with server value if available, otherwise empty string
  const [localJobDescription, setLocalJobDescription] = useState(
    jobPostingData?.jobDescription ?? ""
  );
  const [localPostingUrl, setLocalPostingUrl] = useState(
    jobPostingData?.postingUrl ?? ""
  );
  const [isJobDescriptionDirty, setIsJobDescriptionDirty] = useState(false);
  const [isPostingUrlDirty, setIsPostingUrlDirty] = useState(false);
  const debouncedJobDescription = useDebouncedValue(localJobDescription, 2000);
  const debouncedPostingUrl = useDebouncedValue(localPostingUrl, 2000);
  const hasInitializedRef = useRef(false);
  const previousJobPostingIdRef = useRef<string | null>(null);
  const lastSubmittedJobDescriptionRef = useRef<string | null>(null);
  const lastSubmittedPostingUrlRef = useRef<string | null>(null);

  // Initialize local state from fetched data when it loads or job posting changes
  useEffect(() => {
    // Reset initialization flag when job posting changes
    if (previousJobPostingIdRef.current !== activeJobPostingId) {
      hasInitializedRef.current = false;
      previousJobPostingIdRef.current = activeJobPostingId;
      lastSubmittedJobDescriptionRef.current = null;
      lastSubmittedPostingUrlRef.current = null;
      setIsJobDescriptionDirty(false);
      setIsPostingUrlDirty(false);
    }

    if (jobPostingData?.jobDescription !== undefined && !hasInitializedRef.current) {
      setLocalJobDescription(jobPostingData.jobDescription);
      setLocalPostingUrl(jobPostingData.postingUrl ?? "");
      hasInitializedRef.current = true;
    }
  }, [jobPostingData?.jobDescription, jobPostingData?.postingUrl, activeJobPostingId]);

  // Auto-save when debounced job description changes (only if user has made changes)
  useEffect(() => {
    if (
      !activeJobPostingId ||
      isLoading ||
      !hasInitializedRef.current ||
      !jobPostingData ||
      !isJobDescriptionDirty // only save if the user actually edited
    ) {
      return;
    }

    // Normalize values for comparison (treat undefined/null as empty string)
    const currentValue = jobPostingData.jobDescription ?? "";
    const newValue = debouncedJobDescription;
    
    // Only save if the value actually changed
    if (currentValue === newValue) {
      return;
    }

    // Prevent rapid duplicate updates with the same payload
    if (lastSubmittedJobDescriptionRef.current === newValue) {
      return;
    }

    // Don't save if new value is empty and current value is also empty/undefined
    if (!newValue && !currentValue) {
      return;
    }

    // Save the debounced value
    lastSubmittedJobDescriptionRef.current = newValue;
    updateJobPostingMutation.mutate({
      id: activeJobPostingId,
      data: { jobDescription: newValue },
    });
  }, [debouncedJobDescription, activeJobPostingId, isLoading, jobPostingData, updateJobPostingMutation]);

  // Auto-save when debounced URL changes (only if user has made changes)
  useEffect(() => {
    if (
      !activeJobPostingId ||
      isLoading ||
      !hasInitializedRef.current ||
      !jobPostingData ||
      !isPostingUrlDirty // only save if the user actually edited
    ) {
      return;
    }

    // Normalize values for comparison (treat undefined/null as empty string)
    const currentValue = jobPostingData.postingUrl ?? "";
    const newValue = debouncedPostingUrl.trim();
    
    // Only save if the value actually changed
    if (currentValue === newValue) {
      return;
    }

    // Prevent rapid duplicate updates with the same payload
    if (lastSubmittedPostingUrlRef.current === newValue) {
      return;
    }

    // Don't save if new value is empty and current value is also empty/undefined
    if (!newValue && !currentValue) {
      return;
    }

    // Save the debounced value (send undefined if empty to clear it, or the trimmed value)
    lastSubmittedPostingUrlRef.current = newValue;
    updateJobPostingMutation.mutate({
      id: activeJobPostingId,
      data: { postingUrl: newValue || undefined },
    });
  }, [debouncedPostingUrl, activeJobPostingId, isLoading, jobPostingData, updateJobPostingMutation]);

  if (!activeJobPostingId) {
    return (
      <div className="h-full flex flex-col bg-card border-r border-border">
        <div className="flex-shrink-0 p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Job Description</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">No job posting selected</p>
        </div>
      </div>
    );
  }

  if (isLoading || !hasInitializedRef.current) {
    return (
      <div className="h-full flex flex-col bg-card border-r border-border">
        <div className="flex-shrink-0 p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Job Description</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Job Description</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {updateJobPostingMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Changes save automatically"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* URL Input and Textarea - Takes full remaining height */}
      <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden gap-3">
        <div className="flex-shrink-0">
          <label
            htmlFor="postingUrl"
            className="text-xs font-medium text-foreground mb-1 block"
          >
            Job Posting URL
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="postingUrl"
              type="url"
              value={localPostingUrl}
              onChange={(e) => {
                setLocalPostingUrl(e.target.value);
                setIsPostingUrlDirty(true);
              }}
              placeholder="https://example.com/job-posting"
              className="flex-1 text-sm"
            />
            {localPostingUrl && (
              <a
                href={localPostingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex-shrink-0"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <label
            htmlFor="jobDescription"
            className="text-xs font-medium text-foreground mb-1 block"
          >
            Job Description
          </label>
          <Textarea
            id="jobDescription"
            value={localJobDescription}
            onChange={(e) => {
              setLocalJobDescription(e.target.value);
              setIsJobDescriptionDirty(true);
            }}
            placeholder="Paste or type the job description here..."
            className="w-full resize-none font-mono text-sm flex-1 min-h-0"
          />
        </div>
        {updateJobPostingMutation.isError && (
          <div className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex-shrink-0">
            <p className="text-xs text-destructive">
              {updateJobPostingMutation.error instanceof Error
                ? updateJobPostingMutation.error.message
                : "Failed to save job description"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

