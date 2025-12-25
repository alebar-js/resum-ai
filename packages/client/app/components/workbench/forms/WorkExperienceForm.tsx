import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { Job } from "@app/shared";

interface WorkExperienceFormProps {
  jobs: Job[];
  onChange: (jobs: Job[]) => void;
}

export function WorkExperienceForm({ jobs, onChange }: WorkExperienceFormProps) {
  const addJob = () => {
    const newJob: Job = {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      startDate: "",
      highlights: [],
    };
    onChange([...jobs, newJob]);
  };

  const updateJob = (index: number, updates: Partial<Job>) => {
    const updated = [...jobs];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeJob = (index: number) => {
    onChange(jobs.filter((_, i) => i !== index));
  };

  const addHighlight = (jobIndex: number) => {
    const job = jobs[jobIndex];
    updateJob(jobIndex, {
      highlights: [...job.highlights, ""],
    });
  };

  const updateHighlight = (jobIndex: number, highlightIndex: number, value: string) => {
    const job = jobs[jobIndex];
    const updated = [...job.highlights];
    updated[highlightIndex] = value;
    updateJob(jobIndex, { highlights: updated });
  };

  const removeHighlight = (jobIndex: number, highlightIndex: number) => {
    const job = jobs[jobIndex];
    updateJob(jobIndex, {
      highlights: job.highlights.filter((_, i) => i !== highlightIndex),
    });
  };

  return (
    <div className="space-y-4">
      {jobs.map((job, jobIndex) => (
        <div
          key={job.id}
          className="border border-border rounded-lg p-4 space-y-3 bg-card"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground">Job {jobIndex + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeJob(jobIndex)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Position
            </label>
            <Input
              value={job.position}
              onChange={(e) => updateJob(jobIndex, { position: e.target.value })}
              placeholder="Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Company
            </label>
            <Input
              value={job.company}
              onChange={(e) => updateJob(jobIndex, { company: e.target.value })}
              placeholder="Tech Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <Input
                value={job.startDate}
                onChange={(e) => updateJob(jobIndex, { startDate: e.target.value })}
                placeholder="2020-01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date (leave empty for Present)
              </label>
              <Input
                value={job.endDate || ""}
                onChange={(e) =>
                  updateJob(jobIndex, { endDate: e.target.value || undefined })
                }
                placeholder="2024-12 or leave empty"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Highlights
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addHighlight(jobIndex)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Highlight
              </Button>
            </div>
            <div className="space-y-2">
              {job.highlights.map((highlight, highlightIndex) => (
                <div key={highlightIndex} className="flex gap-2">
                  <Textarea
                    value={highlight}
                    onChange={(e) =>
                      updateHighlight(jobIndex, highlightIndex, e.target.value)
                    }
                    placeholder="Achieved X by doing Y, resulting in Z% improvement"
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHighlight(jobIndex, highlightIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {job.highlights.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No highlights yet. Click "Add Highlight" to add one.
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addJob}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Job Experience
      </Button>
    </div>
  );
}

