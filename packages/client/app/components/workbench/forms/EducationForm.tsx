import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { Education } from "@app/shared";

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  const addEducation = () => {
    onChange([
      ...education,
      {
        institution: "",
        area: "",
        studyType: "",
        startDate: "",
      },
    ]);
  };

  const updateEducation = (index: number, updates: Partial<Education>) => {
    const updated = [...education];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <div
          key={index}
          className="border border-border rounded-lg p-4 space-y-3 bg-card"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground">Education {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeEducation(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Institution
            </label>
            <Input
              value={edu.institution}
              onChange={(e) => updateEducation(index, { institution: e.target.value })}
              placeholder="University of California"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Study Type
              </label>
              <Input
                value={edu.studyType}
                onChange={(e) => updateEducation(index, { studyType: e.target.value })}
                placeholder="Bachelor's"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Area/Field
              </label>
              <Input
                value={edu.area}
                onChange={(e) => updateEducation(index, { area: e.target.value })}
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <Input
                value={edu.startDate}
                onChange={(e) => updateEducation(index, { startDate: e.target.value })}
                placeholder="2016-09"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date (optional)
              </label>
              <Input
                value={edu.endDate || ""}
                onChange={(e) =>
                  updateEducation(index, { endDate: e.target.value || undefined })
                }
                placeholder="2020-05"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEducation}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}

