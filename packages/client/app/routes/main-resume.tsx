import type { Route } from "./+types/main-resume";
import { useEffect } from "react";
import { Explorer } from "~/components/explorer/Explorer";
import { Workbench } from "~/components/workbench/Workbench";
import { useAppStore } from "~/lib/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumAI - Main Resume" },
    { name: "description", content: "AI-powered resume tailoring with diff-based review" },
  ];
}

export default function MainResumeRoute() {
  const setActiveJobPostingId = useAppStore((state) => state.setActiveJobPostingId);
  const setViewMode = useAppStore((state) => state.setViewMode);

  // Ensure we are in master mode with no active job posting
  useEffect(() => {
    setActiveJobPostingId(null);
    setViewMode("master");
  }, [setActiveJobPostingId, setViewMode]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Explorer Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-border flex flex-col">
        <Explorer />
      </aside>

      {/* Main Content Area - Workbench Only */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Workbench />
      </main>
    </div>
  );
}

