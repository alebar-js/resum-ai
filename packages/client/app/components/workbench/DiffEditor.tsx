import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { diffLines, type Change } from "diff";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";
import { useMasterResume, useUpdateMasterResume, useFork, useUpdateFork, useCleanup } from "~/lib/queries";

interface DiffLine {
  content: string;
  type: "unchanged" | "added" | "removed";
  lineNumber?: number;
}

function computeDiffLines(original: string, refactored: string): DiffLine[] {
  const changes: Change[] = diffLines(original, refactored);
  const lines: DiffLine[] = [];
  let lineNumber = 1;

  for (const change of changes) {
    const changeLines = change.value.split("\n");
    // Remove trailing empty string from split
    if (changeLines[changeLines.length - 1] === "") {
      changeLines.pop();
    }

    for (const line of changeLines) {
      if (change.added) {
        lines.push({ content: line, type: "added" });
      } else if (change.removed) {
        lines.push({ content: line, type: "removed", lineNumber });
        lineNumber++;
      } else {
        lines.push({ content: line, type: "unchanged", lineNumber });
        lineNumber++;
      }
    }
  }

  return lines;
}

interface DiffEditorContentProps {
  content: string;
  isEditable?: boolean;
  onContentChange?: (content: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (scrollPercentage: number) => void;
}

function DiffEditorContent({
  content,
  isEditable = false,
  onContentChange,
  scrollRef,
  onScroll,
}: DiffEditorContentProps) {
  const lines = content.split("\n");

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onScroll) return;
      const target = e.currentTarget;
      const scrollPercentage =
        target.scrollTop / (target.scrollHeight - target.clientHeight);
      onScroll(scrollPercentage);
    },
    [onScroll]
  );

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement>}
      className="flex-1 overflow-auto font-mono text-sm"
      onScroll={handleScroll}
    >
      <div className="p-4">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            placeholder={content ? undefined : "Paste your resume content here...\n\nYou can use Markdown formatting:\n- Headers with #\n- Bullet points with -\n- Bold text with **text**\n- And more!"}
            className="w-full min-h-[600px] bg-transparent resize-none focus:outline-none leading-relaxed placeholder:text-muted-foreground/50"
            spellCheck={false}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-10 text-right pr-4 text-muted-foreground select-none">
                  {i + 1}
                </span>
                <span>{line || " "}</span>
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}

interface DiffViewProps {
  original: string;
  refactored: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (scrollPercentage: number) => void;
}

function DiffView({ original, refactored, scrollRef, onScroll }: DiffViewProps) {
  const diffLines = useMemo(
    () => computeDiffLines(original, refactored),
    [original, refactored]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onScroll) return;
      const target = e.currentTarget;
      const scrollPercentage =
        target.scrollTop / (target.scrollHeight - target.clientHeight);
      onScroll(scrollPercentage);
    },
    [onScroll]
  );

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement>}
      className="flex-1 overflow-auto font-mono text-sm"
      onScroll={handleScroll}
    >
      <div className="p-4">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              line.type === "added" && "bg-diff-add",
              line.type === "removed" && "bg-diff-remove"
            )}
          >
            <span className="w-10 text-right pr-4 text-muted-foreground select-none">
              {line.lineNumber ?? ""}
            </span>
            <span
              className={cn(
                line.type === "added" && "text-diff-add-foreground",
                line.type === "removed" && "text-diff-remove-foreground line-through opacity-70"
              )}
            >
              {line.type === "added" && "+ "}
              {line.type === "removed" && "- "}
              {line.content || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiffEditor() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diff = useAppStore((state) => state.diff);
  const updateResolved = useAppStore((state) => state.updateResolved);
  const viewMode = useAppStore((state) => state.viewMode);
  const activeForkId = useAppStore((state) => state.activeForkId);
  
  const { data: masterResume, isLoading: masterLoading, error: masterError } = useMasterResume();
  const { data: activeFork, isLoading: forkLoading, error: forkError } = useFork(activeForkId ?? "");
  const updateMasterResume = useUpdateMasterResume();
  const updateFork = useUpdateFork();
  const cleanupMutation = useCleanup();

  // Local state for editor content to prevent cursor jumping
  const [localContent, setLocalContent] = useState("");

  const isLoading = masterLoading || (activeForkId && forkLoading);
  const error = masterError || (activeForkId && forkError);

  // Sync local content with query data when it changes externally
  useEffect(() => {
    if (diff.isReviewing) {
      setLocalContent(diff.refactored);
    } else if (viewMode === "fork" && activeFork) {
      setLocalContent(activeFork.content);
    } else if (viewMode === "master" && masterResume) {
      setLocalContent(masterResume.content);
    } else if (viewMode === "master" && !masterResume && !masterLoading) {
      setLocalContent("");
    }
  }, [diff.isReviewing, diff.refactored, viewMode, activeFork?.content, masterResume?.content, masterLoading]);

  const handleScrollSync = useCallback((scrollPercentage: number) => {
    // This will be used by the Preview pane for sync scrolling
    if (typeof window !== "undefined") {
      (window as any).__editorScrollPercentage = scrollPercentage;
    }
  }, []);

  const handleContentChange = useCallback(
    (content: string) => {
      // Update local state immediately (no re-render from query)
      setLocalContent(content);

      if (diff.isReviewing) {
        updateResolved(content);
      } else if (viewMode === "fork" && activeForkId) {
        // Debounce fork updates
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          updateFork.mutate({
            id: activeForkId,
            data: { content },
          });
        }, 500);
      } else {
        // Debounce master resume updates
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          updateMasterResume.mutate(content);
        }, 500);
      }
    },
    [diff.isReviewing, viewMode, activeForkId, updateResolved, updateFork, updateMasterResume]
  );

  const handleCleanup = useCallback(async () => {
    if (!localContent.trim()) return;

    try {
      const result = await cleanupMutation.mutateAsync({ text: localContent });
      setLocalContent(result.cleaned);
      // Auto-save the cleaned content
      if (viewMode === "master") {
        updateMasterResume.mutate(result.cleaned);
      } else if (viewMode === "fork" && activeForkId) {
        updateFork.mutate({
          id: activeForkId,
          data: { content: result.cleaned },
        });
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }, [localContent, cleanupMutation, viewMode, activeForkId, updateMasterResume, updateFork]);

  // Show cleanup option when viewing main resume and there's content
  const showCleanup = viewMode === "master" && localContent.trim();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading resume...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-destructive font-medium mb-2">Failed to load resume</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  // Show diff view when reviewing
  if (diff.isReviewing) {
    return (
      <DiffView
        original={diff.original}
        refactored={diff.refactored}
        scrollRef={scrollRef}
        onScroll={handleScrollSync}
      />
    );
  }

  // Always show editor - even if empty, allow user to paste content
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {!localContent && viewMode === "master" && (
        <div className="p-4 border-b border-border bg-card/50">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Welcome! Start by adding your main resume.</p>
            <p className="text-xs">Paste your resume content in the editor below. This will be your base resume that gets adapted for each job posting.</p>
          </div>
        </div>
      )}
      
      {/* Cleanup option - always available when viewing main resume */}
      {showCleanup && (
        <div className="p-3 border-b border-border bg-primary/10 flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">Format your resume</p>
            <p className="text-xs text-muted-foreground">
              Automatically format your resume with proper Markdown structure (H1 for name, H2 for sections).
            </p>
          </div>
          <Button
            onClick={handleCleanup}
            disabled={cleanupMutation.isPending}
            size="sm"
            className="gap-2"
          >
            {cleanupMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Formatting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Format Resume
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error state for cleanup */}
      {cleanupMutation.isError && (
        <div className="p-3 border-b border-border bg-destructive/10">
          <p className="text-sm text-destructive font-medium mb-1">Failed to format resume</p>
          <p className="text-xs text-destructive/80">
            {cleanupMutation.error instanceof Error
              ? cleanupMutation.error.message
              : "An unexpected error occurred. Please try again."}
          </p>
        </div>
      )}

      <DiffEditorContent
        content={localContent}
        isEditable={true}
        onContentChange={handleContentChange}
        scrollRef={scrollRef}
        onScroll={handleScrollSync}
      />
    </div>
  );
}
