import { Button } from "~/components/ui/button";
import { FolderKanban } from "lucide-react";
import { useNavigate } from "react-router";

export function EmptyJobPostingState() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No job posting selected</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select a job posting from the left sidebar, or create a new one.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go to Main Resume
        </Button>
      </div>
    </div>
  );
}


