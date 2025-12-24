import { GitFork, Loader2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";
import { useForks } from "~/lib/queries";
import type { ForkStatus } from "~/lib/api";

function getStatusVariant(status: ForkStatus) {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "MERGED":
      return "merged";
    case "EXPORTED":
      return "exported";
    default:
      return "secondary";
  }
}

export function ForksList() {
  const { data: forks, isLoading, error } = useForks();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const activeForkId = useAppStore((state) => state.activeForkId);
  const setActiveForkId = useAppStore((state) => state.setActiveForkId);

  const filteredForks = forks?.filter((fork) =>
    fork.title.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (!filteredForks || filteredForks.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        {searchQuery ? "No matching job postings" : "No job postings yet"}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1">
        {filteredForks.map((fork) => (
          <button
            key={fork.id}
            onClick={() => setActiveForkId(fork.id)}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left transition-colors",
              activeForkId === fork.id
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-accent/30"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <GitFork className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{fork.title}</span>
            </div>
            <Badge variant={getStatusVariant(fork.status)} className="flex-shrink-0 text-xs">
              {fork.status}
            </Badge>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

