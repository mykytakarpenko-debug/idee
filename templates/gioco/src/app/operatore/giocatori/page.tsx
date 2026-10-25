import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/it";
import { PlayersView } from "@/features/panel/players-view";

export const metadata: Metadata = {
  title: copy.panel.players.title,
  robots: { index: false, follow: false },
};

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <PlayersView />
    </Suspense>
  );
}
