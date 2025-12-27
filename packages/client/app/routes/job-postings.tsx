import type { Route } from "./+types/job-postings";
import { useEffect } from "react";
import { Explorer } from "~/components/explorer/Explorer";
import { EmptyJobPostingState } from "~/components/workbench/EmptyJobPostingState";
import { useAppStore } from "~/lib/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumAI - Job Postings" },
    { name: "description", content: "Select a job posting to work on" },
  ];
}

export default function JobPostingsRoute() {
  const setActiveJobPostingId = useAppStore((state) => state.setActiveJobPostingId);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);

  useEffect(() => {
    // No active selection. Keep URL stable and render a dedicated empty state (no split panes).
    setActiveJobPostingId(null);
    setViewMode("master");
    setJobPostingView(null);
  }, [setActiveJobPostingId, setViewMode, setJobPostingView]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-border flex flex-col">
        <Explorer />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <EmptyJobPostingState />
      </main>
    </div>
  );
}


