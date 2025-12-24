import { useRef, useEffect, useCallback, useState } from "react";
import { Copy, Download, Eye, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MarkdownPreview } from "./MarkdownPreview";
import { useAppStore } from "~/lib/store";
import { useMasterResume, useFork, useUpdateFork } from "~/lib/queries";

export function Preview() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  const diff = useAppStore((state) => state.diff);
  const viewMode = useAppStore((state) => state.viewMode);
  const activeForkId = useAppStore((state) => state.activeForkId);
  
  const { data: masterResume, isLoading: masterLoading, error: masterError } = useMasterResume();
  const { data: activeFork, isLoading: forkLoading, error: forkError } = useFork(activeForkId ?? "");
  const updateFork = useUpdateFork();

  const isLoading = masterLoading || (activeForkId && forkLoading);
  const error = masterError || (activeForkId && forkError);

  // Determine what content to show
  let content = "";
  let title = "resume";

  if (diff.isReviewing) {
    content = diff.refactored;
    title = "tailored-resume";
  } else if (viewMode === "fork" && activeFork) {
    content = activeFork.content;
    title = activeFork.title.toLowerCase().replace(/\s+/g, "-");
  } else {
    content = masterResume?.content || "";
    title = "main-resume";
  }

  // Sync scroll with editor
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncScroll = () => {
      const scrollPercentage = (window as any).__editorScrollPercentage;
      if (scrollPercentage !== undefined && scrollRef.current) {
        const maxScroll =
          scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
        scrollRef.current.scrollTop = maxScroll * scrollPercentage;
      }
    };

    // Poll for scroll updates (simple approach)
    const interval = setInterval(syncScroll, 100);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    if (!content) return;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark fork as exported if viewing a fork
    if (viewMode === "fork" && activeForkId && activeFork?.status !== "EXPORTED") {
      updateFork.mutate({
        id: activeForkId,
        data: { status: "EXPORTED" },
      });
    }
  }, [content, title, viewMode, activeForkId, activeFork?.status, updateFork]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Eye className="w-4 h-4" />
          Preview
          {diff.isReviewing && (
            <span className="text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              Adapted
            </span>
          )}
          {viewMode === "fork" && activeFork && !diff.isReviewing && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-32">
              {activeFork.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            disabled={!content}
            title="Copy to clipboard"
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
            disabled={!content}
            title="Download as .md"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Markdown Preview */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4"
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading preview...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive font-medium mb-2">Failed to load preview</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        )}

        {/* Data loaded - empty content */}
        {!isLoading && !error && !content && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              Preview will appear here once you have content.
            </p>
          </div>
        )}

        {/* Data loaded - with content */}
        {!isLoading && !error && content && <MarkdownPreview content={content} />}
      </div>
    </div>
  );
}
