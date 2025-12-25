import type { Route } from "./+types/job-posting.$id";
import { useEffect } from "react";
import { useParams } from "react-router";
import { Explorer } from "~/components/explorer/Explorer";
import { Workbench } from "~/components/workbench/Workbench";
import { useAppStore } from "~/lib/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumAI - Job Posting" },
    { name: "description", content: "AI-powered resume tailoring with diff-based review" },
  ];
}

export default function JobPostingRoute() {
  const params = useParams();
  const setActiveJobPostingId = useAppStore((state) => state.setActiveJobPostingId);
  const setViewMode = useAppStore((state) => state.setViewMode);

  useEffect(() => {
    const id = params.id ?? null;
    setActiveJobPostingId(id);
    setViewMode(id ? "jobPosting" : "master");
  }, [params.id, setActiveJobPostingId, setViewMode]);

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

