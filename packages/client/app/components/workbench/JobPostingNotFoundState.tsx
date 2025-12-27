import { Button } from "~/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

export function JobPostingNotFoundState() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Job posting not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This job posting may have been deleted or you may not have access to it.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate("/job-postings")}>
            Back to Job Postings
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Main Resume
          </Button>
        </div>
      </div>
    </div>
  );
}


