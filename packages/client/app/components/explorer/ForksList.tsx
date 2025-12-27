import { FolderKanban, Loader2, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useAppStore } from "~/lib/store";
import { useJobPostings } from "~/lib/queries";
import { FolderTree } from "./FolderTree";

interface JobPostingsListProps {
  onCreateClick?: () => void;
  createFolderTrigger?: number;
}

export function JobPostingsList({ onCreateClick, createFolderTrigger }: JobPostingsListProps) {
  const { data: jobPostings, isLoading, error } = useJobPostings();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeJobPostingId = useAppStore((state) => state.activeJobPostingId);

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

  if (!jobPostings || jobPostings.length === 0) {
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
      <FolderTree
        jobPostings={jobPostings}
        activeJobPostingId={activeJobPostingId}
        searchQuery={searchQuery}
        createFolderTrigger={createFolderTrigger}
      />
    </ScrollArea>
  );
}

