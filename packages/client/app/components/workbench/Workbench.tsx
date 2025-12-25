import { ModularWorkbench } from "./ModularWorkbench";
import { JDStagingArea } from "./JDStagingArea";
import { DiffEditor } from "./DiffEditor";
import { FloatingActionBar } from "./FloatingActionBar";
import { useAppStore } from "~/lib/store";
import { useMasterResumeData } from "~/lib/queries";

// Feature flag: use modular editor if master resume has JSON data
const USE_MODULAR_EDITOR = true; // Can be made dynamic based on data availability

export function Workbench() {
  const viewMode = useAppStore((state) => state.viewMode);
  const isReviewing = useAppStore((state) => state.diff.isReviewing);
  const { data: masterResumeData } = useMasterResumeData();
  
  // Use modular editor if enabled and we have JSON data (or if we want to force it)
  const useModular = USE_MODULAR_EDITOR || !!masterResumeData?.data;
  
  if (useModular) {
    return <ModularWorkbench />;
  }
  
  // Legacy markdown-based editor
  const showJDStaging = viewMode !== "master" || isReviewing;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* JD Staging Area - hidden when editing main resume */}
      {showJDStaging && <JDStagingArea />}

      {/* Diff Editor - takes full height when JD staging is hidden */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <DiffEditor />
      </div>

      {/* Floating Action Bar - shown during diff review */}
      <FloatingActionBar />
    </div>
  );
}
