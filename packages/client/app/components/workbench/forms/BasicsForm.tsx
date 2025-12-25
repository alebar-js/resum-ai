import type { Basics } from "@app/shared";
import { Input } from "~/components/ui/input";

interface BasicsFormProps {
  data: Basics;
  onChange: (data: Basics) => void;
}

export function BasicsForm({ data, onChange }: BasicsFormProps) {
  const updateField = <K extends keyof Basics>(field: K, value: Basics[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Full Name
        </label>
        <Input
          value={data.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Professional Label
        </label>
        <Input
          value={data.label}
          onChange={(e) => updateField("label", e.target.value)}
          placeholder="Senior Fullstack Engineer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <Input
          type="email"
          value={data.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="john.doe@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Phone
        </label>
        <Input
          type="tel"
          value={data.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Website/Portfolio URL (optional)
        </label>
        <Input
          type="url"
          value={data.url || ""}
          onChange={(e) => updateField("url", e.target.value || undefined)}
          placeholder="https://johndoe.dev"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            City
          </label>
          <Input
            value={data.location?.city || ""}
            onChange={(e) =>
              updateField("location", {
                ...data.location,
                city: e.target.value,
                region: data.location?.region || "",
              })
            }
            placeholder="San Francisco"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Region/State
          </label>
          <Input
            value={data.location?.region || ""}
            onChange={(e) =>
              updateField("location", {
                ...data.location,
                city: data.location?.city || "",
                region: e.target.value,
              })
            }
            placeholder="CA"
          />
        </div>
      </div>
    </div>
  );
}

