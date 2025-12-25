import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useCreateJobPostingData, useMasterResumeData } from "~/lib/queries";
import { useAppStore } from "~/lib/store";

const createJobPostingSchema = z.object({
  title: z.string().min(1, "Job posting name is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  postingUrl: z.string().optional(),
});

type CreateJobPostingForm = z.infer<typeof createJobPostingSchema>;

interface CreateJobPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobPostingDialog({
  open,
  onOpenChange,
}: CreateJobPostingDialogProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { data: masterResume } = useMasterResumeData();
  const createJobPostingMutation = useCreateJobPostingData();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateJobPostingForm>({
    resolver: zodResolver(createJobPostingSchema as any),
  });

  const onSubmit = async (data: CreateJobPostingForm) => {
    if (!masterResume) {
      setError("Please create a main resume first");
      return;
    }

    // Validate URL if provided
    if (data.postingUrl && data.postingUrl.trim() !== "") {
      try {
        new URL(data.postingUrl);
      } catch {
        setError("Please enter a valid URL");
        return;
      }
    }

    setError(null);
    try {
      const newJobPosting = await createJobPostingMutation.mutateAsync({
        title: data.title,
        jobDescription: data.jobDescription,
        postingUrl: data.postingUrl && data.postingUrl.trim() !== "" ? data.postingUrl : undefined,
        data: masterResume.data, // Start with main resume JSON data
      });

      // Navigate to the new job posting view
      navigate(`/job-posting/${newJobPosting.id}`);

      // Reset form and close dialog
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add job posting"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Job Posting</DialogTitle>
          <DialogDescription>
            Create a new job posting to adapt your main resume. You'll be able
            to paste the job description and adapt your resume accordingly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-foreground"
            >
              Job Posting Name
            </label>
            <Input
              id="title"
              placeholder="e.g., Meta - Sr. Engineer"
              {...register("title")}
              disabled={createJobPostingMutation.isPending}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="postingUrl"
              className="text-sm font-medium text-foreground"
            >
              Job Posting URL (Optional)
            </label>
            <Input
              id="postingUrl"
              type="url"
              placeholder="https://example.com/job-posting"
              {...register("postingUrl")}
              disabled={createJobPostingMutation.isPending}
            />
            {errors.postingUrl && (
              <p className="text-sm text-destructive">
                {errors.postingUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="jobDescription"
              className="text-sm font-medium text-foreground"
            >
              Job Description
            </label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here..."
              className="min-h-[200px]"
              {...register("jobDescription")}
              disabled={createJobPostingMutation.isPending}
            />
            {errors.jobDescription && (
              <p className="text-sm text-destructive">
                {errors.jobDescription.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={createJobPostingMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createJobPostingMutation.isPending}>
              {createJobPostingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job Posting
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

