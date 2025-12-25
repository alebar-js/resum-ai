import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import type { Skill } from "@app/shared";

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export function SkillsForm({ skills, onChange }: SkillsFormProps) {
  const addSkill = () => {
    onChange([...skills, { name: "", keywords: [] }]);
  };

  const updateSkill = (index: number, updates: Partial<Skill>) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const addKeyword = (skillIndex: number) => {
    const skill = skills[skillIndex];
    updateSkill(skillIndex, {
      keywords: [...skill.keywords, ""],
    });
  };

  const updateKeyword = (skillIndex: number, keywordIndex: number, value: string) => {
    const skill = skills[skillIndex];
    const updated = [...skill.keywords];
    updated[keywordIndex] = value;
    updateSkill(skillIndex, { keywords: updated });
  };

  const removeKeyword = (skillIndex: number, keywordIndex: number) => {
    const skill = skills[skillIndex];
    updateSkill(skillIndex, {
      keywords: skill.keywords.filter((_, i) => i !== keywordIndex),
    });
  };

  return (
    <div className="space-y-4">
      {skills.map((skill, skillIndex) => (
        <div
          key={skillIndex}
          className="border border-border rounded-lg p-4 space-y-3 bg-card"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Skill Category
              </label>
              <Input
                value={skill.name}
                onChange={(e) => updateSkill(skillIndex, { name: e.target.value })}
                placeholder="Frontend"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSkill(skillIndex)}
              className="text-red-600 hover:text-red-700 ml-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground">
                Keywords
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addKeyword(skillIndex)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Keyword
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.keywords.map((keyword, keywordIndex) => (
                <div
                  key={keywordIndex}
                  className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1"
                >
                  <Input
                    value={keyword}
                    onChange={(e) =>
                      updateKeyword(skillIndex, keywordIndex, e.target.value)
                    }
                    placeholder="React"
                    className="border-0 p-0 h-auto w-24 focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeKeyword(skillIndex, keywordIndex)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {skill.keywords.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No keywords yet. Click "Add Keyword" to add one.
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSkill}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Skill Category
      </Button>
    </div>
  );
}

