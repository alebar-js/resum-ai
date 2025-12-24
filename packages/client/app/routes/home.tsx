import type { Route } from "./+types/home";
import { Explorer } from "~/components/explorer/Explorer";
import { Workbench } from "~/components/workbench/Workbench";
import { Preview } from "~/components/preview/Preview";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumAI - Resume Adapt IDE" },
    { name: "description", content: "AI-powered resume tailoring with diff-based review" },
  ];
}

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Explorer Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-border flex flex-col">
        <Explorer />
      </aside>

      {/* Workbench Center */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Workbench />
      </main>

      {/* Preview Pane */}
      <aside className="w-96 flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
        <Preview />
      </aside>
    </div>
  );
}
