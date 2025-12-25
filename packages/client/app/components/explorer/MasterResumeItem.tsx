import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";
import { useMasterResumeData } from "~/lib/queries";
import { Button } from "~/components/ui/button";
import { IngestDialog } from "../ingestion/IngestDialog";

export function MasterResumeItem() {
  const navigate = useNavigate();
  const [isIngestDialogOpen, setIsIngestDialogOpen] = useState(false);
  const viewMode = useAppStore((state) => state.viewMode);
  const { data: masterResume } = useMasterResumeData();

  const isActive = viewMode === "master";
  const hasResume = !!masterResume?.data;

  const handleClick = () => {
    navigate("/main-resume");
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsIngestDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        {hasResume ? (
          <button
            onClick={handleClick}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-foreground transition-colors text-left",
              isActive
                ? "bg-accent/50 glow-primary"
                : "hover:bg-accent/30"
            )}
          >
            <FileText className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium truncate">Main Resume</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground px-3">
              No resume yet. Upload one to get started.
            </div>
            <Button
              onClick={handleUploadClick}
              className="w-full gap-2"
              variant="outline"
            >
              <Upload className="w-4 h-4" />
              Upload Resume
            </Button>
          </div>
        )}
      </div>

      <IngestDialog
        open={isIngestDialogOpen}
        onOpenChange={setIsIngestDialogOpen}
      />
    </>
  );
}

