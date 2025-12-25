import { useState, useRef, useEffect, type ReactNode } from "react";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { useLocalStorage } from "~/lib/hooks/use-local-storage";

interface ResizablePaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultWidth?: number; // Percentage (0-100)
  minWidth?: number; // Percentage
  maxWidth?: number; // Percentage
  storageKey?: string; // localStorage key for persisting width
  collapsible?: boolean; // Enable collapse/expand functionality
  defaultCollapsed?: boolean;
  className?: string;
}

export function ResizablePane({
  left,
  right,
  defaultWidth = 50,
  minWidth = 20,
  maxWidth = 80,
  storageKey,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: ResizablePaneProps) {
  // Use localStorage if storageKey is provided, otherwise use state
  const [storedWidth, setStoredWidth] = useLocalStorage(
    storageKey || "resizable-pane-width",
    defaultWidth
  );
  const [leftWidth, setLeftWidth] = useState(storedWidth);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const collapsedWidthRef = useRef(storedWidth); // Remember width before collapse

  // Sync state with stored width on mount
  useEffect(() => {
    setLeftWidth(storedWidth);
  }, [storedWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, startWidthRef.current + deltaPercent)
      );

      // Only update local state during dragging for smooth visual updates
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      // Persist to localStorage only when dragging ends
      if (storageKey) {
        setStoredWidth(leftWidth);
      }
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minWidth, maxWidth, storageKey, setStoredWidth, leftWidth]);

  const handleToggleCollapse = () => {
    if (isCollapsed) {
      // Expand: restore previous width
      setLeftWidth(collapsedWidthRef.current);
      if (storageKey) {
        setStoredWidth(collapsedWidthRef.current);
      }
    } else {
      // Collapse: remember current width and set to 0
      collapsedWidthRef.current = leftWidth;
      setLeftWidth(0);
    }
    setIsCollapsed(!isCollapsed);
  };

  const effectiveLeftWidth = isCollapsed ? 0 : leftWidth;

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full overflow-hidden", className)}
    >
      {/* Left Pane */}
      <div
        className={cn(
          "flex-shrink-0 overflow-hidden",
          !isDragging && "transition-all duration-200",
          isCollapsed && "w-0"
        )}
        style={{ width: isCollapsed ? "0" : `${effectiveLeftWidth}%` }}
      >
        {left}
      </div>

      {/* Resizer with collapse button */}
      <div className={cn("relative flex-shrink-0 h-full", isCollapsed && "w-0")}>
        {/* Collapse button */}
        {collapsible && (
          <button
            onClick={handleToggleCollapse}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-md bg-background border border-border shadow-sm hover:bg-accent transition-colors",
              isCollapsed ? "right-0 translate-x-full" : "-left-2"
            )}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Resizer handle */}
        {!isCollapsed && (
          <div
            className={cn(
              "w-1 h-full bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center transition-colors relative group",
              isDragging && "bg-primary"
            )}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 w-4 -left-1.5" />
            <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Right Pane */}
      <div
        className="flex-1 overflow-hidden min-w-0"
        style={{ width: isCollapsed ? "100%" : `${100 - effectiveLeftWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
}

