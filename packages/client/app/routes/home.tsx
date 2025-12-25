import type { Route } from "./+types/home";
import { Explorer } from "~/components/explorer/Explorer";
import { Workbench } from "~/components/workbench/Workbench";
import { useAppStore } from "~/lib/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumAI - Resume Adapt IDE" },
    { name: "description", content: "AI-powered resume tailoring with diff-based review" },
  ];
}

export default function Home() {
  // Temporary redirect logic: Home acts like main-resume
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
