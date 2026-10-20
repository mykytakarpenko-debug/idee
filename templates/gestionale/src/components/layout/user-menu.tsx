"use client";

import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { useDataStore } from "@/store/data-store";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const settings = useDataStore((state) => state.settings);
  const ready = useDataStore((state) => state.ready);
  const name = ready ? settings.ownerName : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-85 sm:size-9">
        <Avatar name={name || "·"} size="sm" className="size-8" />
        <span className="sr-only">
          {copy.topbar.account}
          {name ? `: ${name}` : ""}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-fg">{name}</p>
          <p className="truncate text-xs text-fg-muted">
            {ready ? `${settings.ownerRole} · ${settings.name}` : null}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(routes.settings)}>
          <Settings aria-hidden />
          {copy.topbar.profile}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{copy.topbar.theme}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
        >
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden />
            {copy.topbar.themeSystem}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden />
            {copy.topbar.themeLight}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden />
            {copy.topbar.themeDark}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(routes.login)}>
          <LogOut aria-hidden />
          {copy.topbar.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
