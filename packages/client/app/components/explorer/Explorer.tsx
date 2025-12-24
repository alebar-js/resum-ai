import { FileText, GitFork } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { MasterResumeItem } from "./MasterResumeItem";
import { ForksList } from "./ForksList";

export function Explorer() {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">ResumAI</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <SearchBar />
      </div>

      {/* Main Resume - Pinned */}
      <div className="p-3 border-b border-border">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Main Resume
        </div>
        <MasterResumeItem />
      </div>

      {/* Job Postings List */}
      <div className="flex-1 overflow-hidden flex flex-col p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          Job Postings
        </div>
        <ForksList />
      </div>
    </div>
  );
}
