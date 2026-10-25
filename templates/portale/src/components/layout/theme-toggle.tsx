"use client";

import { Moon, Sun } from "lucide-react";
import { copy } from "@/content/it";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

/** Interruttore rapido chiaro/scuro (la preferenza resta su questo dispositivo). */
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const dark = resolved === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setPreference(dark ? "light" : "dark")}
      aria-label={copy.theme.toggle}
      aria-pressed={dark}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
