import { FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/lib/store";

export function MasterResumeItem() {
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setActiveForkId = useAppStore((state) => state.setActiveForkId);
  
  const isActive = viewMode === "master";

  const handleClick = () => {
    setViewMode("master");
    setActiveForkId(null);
  };

  return (
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
  );
}

