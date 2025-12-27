import { useState } from "react";
import { FileText, FolderKanban, Plus, FolderPlus } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { MasterResumeItem } from "./MasterResumeItem";
import { JobPostingsList } from "./ForksList";
import { CreateJobPostingDialog } from "./CreateJobPostingDialog";
import { Button } from "~/components/ui/button";
import { ThemeSwitcher } from "~/components/ui/theme-switcher";

export function Explorer() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFolderTrigger, setCreateFolderTrigger] = useState(0);

  return (
    <>
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
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <FolderKanban className="w-3 h-3" />
              Job Postings
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCreateFolderTrigger((prev) => prev + 1)}
                title="Create new folder"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsCreateDialogOpen(true)}
                title="Add new job posting"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <JobPostingsList 
            onCreateClick={() => setIsCreateDialogOpen(true)}
            createFolderTrigger={createFolderTrigger}
          />
        </div>

        {/* Theme Switcher */}
        <div className="p-3 border-t border-border flex justify-center">
          <ThemeSwitcher />
        </div>
      </div>

      <CreateJobPostingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
