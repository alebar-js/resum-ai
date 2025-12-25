import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAppStore } from "~/lib/store";

/**
 * Gets the effective theme (resolves "system" to actual light/dark)
 */
function getEffectiveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeSwitcher() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const handleClick = () => {
    // Cycle through: light → dark → system
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const effectiveTheme = getEffectiveTheme(theme);

  // Determine which icon to show
  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-4 h-4" />;
    }
    return effectiveTheme === "light" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    );
  };

  // Determine tooltip text
  const getTooltip = () => {
    if (theme === "system") {
      return "Theme: System (click to switch to Light)";
    }
    if (theme === "light") {
      return "Theme: Light (click to switch to Dark)";
    }
    return "Theme: Dark (click to switch to System)";
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-8 w-8"
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </Button>
  );
}

