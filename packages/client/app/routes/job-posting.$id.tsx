import type { Route } from "./+types/job-posting.$id";
import { useEffect } from "react";
import { useParams } from "react-router";
import { Explorer } from "~/components/explorer/Explorer";
import { Workbench } from "~/components/workbench/Workbench";
import { useAppStore } from "~/lib/store";
import { useJobPostingData } from "~/lib/queries";
import { ApiError } from "~/lib/api";
import { JobPostingNotFoundState } from "~/components/workbench/JobPostingNotFoundState";
import { Loader2 } from "lucide-react";

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
  const setJobPostingView = useAppStore((state) => state.setJobPostingView);

  const id = params.id ?? "";
  const { data, isLoading, isError, error } = useJobPostingData(id);

  // When the posting exists, sync store and show the workbench.
  useEffect(() => {
    if (data?.id) {
      setActiveJobPostingId(data.id);
      setViewMode("jobPosting");
      setJobPostingView(null);
    }
  }, [data?.id, setActiveJobPostingId, setViewMode, setJobPostingView]);

  useEffect(() => {
    // If the posting is missing/invalid, clear active state so we don't render stale content elsewhere.
    if (isError && error instanceof ApiError && error.status === 404) {
      setActiveJobPostingId(null);
      setViewMode("master");
      setJobPostingView(null);
    }
  }, [isError, error, setActiveJobPostingId, setViewMode, setJobPostingView]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Explorer Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-border flex flex-col">
        <Explorer />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError && error instanceof ApiError && error.status === 404 ? (
          <JobPostingNotFoundState />
        ) : (
          <Workbench />
        )}
      </main>
    </div>
  );
}

