import { useState, useMemo } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowLeft, FileText, Loader2, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MinimalistPdf } from "~/lib/export/MinimalistPdf";
import { generateDocx } from "~/lib/export/docx";
import { useAppStore } from "~/lib/store";
import { useJobPostingData, useMasterResumeData } from "~/lib/queries";

export function ExportResume() {
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);

  const { data: jobPostingData, isLoading: isJobPostingLoading } = useJobPostingData(activeJobPostingId ?? "");
  const { data: masterResumeData, isLoading: isMasterLoading } = useMasterResumeData();

  const [isDocxExporting, setIsDocxExporting] = useState(false);

  const resume = useMemo(
    () => jobPostingData?.data || masterResumeData?.data,
    [jobPostingData?.data, masterResumeData?.data]
  );

  const isLoading = isJobPostingLoading || isMasterLoading;
  const activeSource = jobPostingData?.data ? "Personalized resume" : masterResumeData?.data ? "Master resume" : null;

  const handleDocxExport = async () => {
    if (!resume) return;
    setIsDocxExporting(true);
    try {
      const blob = await generateDocx(resume);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resume.basics.name || "resume"}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDocxExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-foreground">No resume available</h2>
          <p className="text-sm text-muted-foreground">
            Create or adapt a resume for this job posting before exporting.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setJobPostingView("actions")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Actions
            </Button>
            <Button onClick={() => setJobPostingView("resume")}>Open Resume Editor</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Export Resume</p>
            <h2 className="text-2xl font-semibold text-foreground mt-1">
              Download your tailored resume
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Choose a format. We’ll use your personalized resume if it exists; otherwise, the master resume.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setJobPostingView("actions")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => setJobPostingView("resume")}>
              Edit Resume
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Active source</p>
              <p className="text-xs text-muted-foreground">
                {activeSource} {jobPostingData?.title ? `for ${jobPostingData.title}` : ""}
              </p>
            </div>
            {jobPostingData?.data ? (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Personalized
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                Master
              </span>
            )}
          </div>

          <div className="p-4 grid gap-3 sm:grid-cols-2">
            <PDFDownloadLink
              document={<MinimalistPdf resume={resume} />}
              fileName={`${resume.basics.name || "resume"}-minimalist.pdf`}
            >
              {({ loading }) => (
                <Button
                  className="w-full justify-start gap-3"
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Download PDF (Minimalist)
                </Button>
              )}
            </PDFDownloadLink>

            <Button
              className="w-full justify-start gap-3"
              variant="secondary"
              onClick={handleDocxExport}
              disabled={isDocxExporting}
            >
              {isDocxExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Word (.docx)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

