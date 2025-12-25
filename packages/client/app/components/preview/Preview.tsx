import { useCallback, useState } from "react";
import { Copy, Download, Eye, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ResumeRenderer } from "./ResumeRenderer";
import { useAppStore } from "~/lib/store";
import { useMasterResumeData, useJobPostingData, useUpdateJobPosting } from "~/lib/queries";

export function Preview() {
  const [copied, setCopied] = useState(false);
  
  const diffData = useAppStore((state) => state.diffData);
  const viewMode = useAppStore((state) => state.viewMode);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);

  const { data: masterResumeData, isLoading: masterLoading } = useMasterResumeData();
  const { data: activeJobPostingData, isLoading: jobPostingLoading } = useJobPostingData(activeJobPostingId);
  const updateJobPosting = useUpdateJobPosting();

  const isLoading = masterLoading || (activeJobPostingId && jobPostingLoading);

  // Determine what resume data to show (JSON only now)
  let resumeData = null;
  let title = "resume";

  if (diffData.isReviewing && diffData.resolved) {
    resumeData = diffData.resolved;
    title = "tailored-resume";
  } else if (viewMode === "jobPosting") {
    if (activeJobPostingData?.data) {
      resumeData = activeJobPostingData.data;
      title = activeJobPostingData.title.toLowerCase().replace(/\s+/g, "-");
    }
  } else {
    if (masterResumeData?.data) {
      resumeData = masterResumeData.data;
    title = "main-resume";
    }
  }


  const handleCopy = useCallback(async () => {
    if (!resumeData) return;
    
    const textToCopy = JSON.stringify(resumeData, null, 2);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [resumeData]);

  const handleDownload = useCallback(() => {
    if (!resumeData) return;
    
    const textToDownload = JSON.stringify(resumeData, null, 2);
    
    const blob = new Blob([textToDownload], { 
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark job posting as exported if viewing a job posting
    if (viewMode === "jobPosting" && activeJobPostingId && activeJobPostingData?.status !== "EXPORTED") {
      updateJobPosting.mutate({
        id: activeJobPostingId,
        data: { status: "EXPORTED" },
      });
    }
  }, [resumeData, title, viewMode, activeJobPostingId, activeJobPostingData?.status, updateJobPosting]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Eye className="w-4 h-4" />
          Preview
          {diffData.isReviewing && (
            <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              Adapted
            </span>
          )}
          {viewMode === "jobPosting" && activeJobPostingData && !diffData.isReviewing && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-32">
              {activeJobPostingData.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!resumeData}
            title="Copy JSON to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={!resumeData}
            title="Download as JSON"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading preview...</span>
            </div>
          </div>
        )}

        {/* Data loaded - empty content */}
        {!isLoading && !resumeData && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              Preview will appear here once you have resume data.
            </p>
          </div>
        )}

        {/* Data loaded - with JSON data */}
        {!isLoading && resumeData && (
          <ResumeRenderer data={resumeData} />
        )}
      </div>
    </div>
  );
}
