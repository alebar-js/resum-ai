import { JDStagingArea } from "./JDStagingArea";
import { DiffEditor } from "./DiffEditor";
import { FloatingActionBar } from "./FloatingActionBar";
import { useAppStore } from "~/lib/store";

export function Workbench() {
  const viewMode = useAppStore((state) => state.viewMode);
  const isReviewing = useAppStore((state) => state.diff.isReviewing);
  
  // Hide JD staging area when editing main resume (not in review mode)
  const showJDStaging = viewMode !== "master" || isReviewing;

  return (
    <div className="flex flex-col h-full">
      {/* JD Staging Area - hidden when editing main resume */}
      {showJDStaging && <JDStagingArea />}

      {/* Diff Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <DiffEditor />
      </div>

      {/* Floating Action Bar - shown during diff review */}
      <FloatingActionBar />
    </div>
  );
}
