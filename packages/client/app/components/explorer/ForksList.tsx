import { FolderKanban, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";
import { useJobPostings } from "~/lib/queries";
import type { JobPosting, JobPostingStatus } from "~/lib/api";

interface JobPostingsListProps {
  onCreateClick?: () => void;
}

function getStatusVariant(status: JobPostingStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "in-progress";
    case "READY":
      return "ready";
    case "EXPORTED":
      return "exported";
    case "APPLIED":
      return "applied";
    case "OFFER":
      return "offer";
    case "REJECTED":
      return "rejected";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: JobPostingStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "READY":
      return "Ready";
    case "EXPORTED":
      return "Exported";
    case "APPLIED":
      return "Applied";
    case "OFFER":
      return "Offer";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function JobPostingsList({ onCreateClick }: JobPostingsListProps) {
  const navigate = useNavigate();
  const { data: jobPostings, isLoading, error } = useJobPostings();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);

  const filteredJobPostings = jobPostings?.filter((jobPosting) =>
    jobPosting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-3 py-2">
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive font-medium mb-1">Failed to load job postings</p>
          <p className="text-xs text-destructive/80">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!filteredJobPostings || filteredJobPostings.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FolderKanban className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-1">
            {searchQuery ? "No matching job postings" : "No job postings yet"}
          </p>
          {!searchQuery && onCreateClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateClick}
              className="mt-3 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Job Posting
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1">
        {filteredJobPostings.map((jobPosting: JobPosting) => (
          <button
            key={jobPosting.id}
            onClick={() => navigate(`/job-posting/${jobPosting.id}`)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left transition-colors",
              activeJobPostingId === jobPosting.id
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-accent/30"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{jobPosting.title}</span>
            </div>
            <Badge variant={getStatusVariant(jobPosting.status)} className="flex-shrink-0 text-xs">
              {getStatusLabel(jobPosting.status)}
            </Badge>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

