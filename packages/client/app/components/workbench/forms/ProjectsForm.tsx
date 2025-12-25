import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { Project } from "@app/shared";

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  const addProject = () => {
    onChange([
      ...projects,
      {
        name: "",
        description: "",
        highlights: [],
      },
    ]);
  };

  const updateProject = (index: number, updates: Partial<Project>) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], ...updates } as Project;
    onChange(updated);
  };

  const removeProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const addHighlight = (projectIndex: number) => {
    const project = projects[projectIndex];
    if (!project) return;
    updateProject(projectIndex, {
      highlights: [...project.highlights, ""],
    });
  };

  const updateHighlight = (
    projectIndex: number,
    highlightIndex: number,
    value: string
  ) => {
    const project = projects[projectIndex];
    if (!project) return;
    const updated = [...project.highlights];
    updated[highlightIndex] = value;
    updateProject(projectIndex, { highlights: updated });
  };

  const removeHighlight = (projectIndex: number, highlightIndex: number) => {
    const project = projects[projectIndex];
    if (!project) return;
    updateProject(projectIndex, {
      highlights: project.highlights.filter((_, i) => i !== highlightIndex),
    });
  };

  return (
    <div className="space-y-4">
      {projects.map((project, index) => {
        if (!project) return null;
        return (
          <div
            key={index}
          className="border border-border rounded-lg p-4 space-y-3 bg-card"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground">Project {index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeProject(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Project Name
              </label>
              <Input
                value={project.name}
                onChange={(e) => updateProject(index, { name: e.target.value })}
                placeholder="My Awesome Project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <Textarea
                value={project.description}
                onChange={(e) =>
                  updateProject(index, { description: e.target.value })
                }
                placeholder="A brief description of the project..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                URL (optional)
              </label>
              <Input
                type="url"
                value={project.url || ""}
                onChange={(e) =>
                  updateProject(index, { url: e.target.value || undefined })
                }
                placeholder="https://project.example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Highlights
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addHighlight(index)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Highlight
                </Button>
              </div>
              <div className="space-y-2">
                {project.highlights.map((highlight, highlightIndex) => (
                  <div key={highlightIndex} className="flex gap-2">
                    <Textarea
                      value={highlight}
                      onChange={(e) =>
                        updateHighlight(index, highlightIndex, e.target.value)
                      }
                      placeholder="Built X feature using Y technology"
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHighlight(index, highlightIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {project.highlights.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No highlights yet. Click "Add Highlight" to add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addProject}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}

