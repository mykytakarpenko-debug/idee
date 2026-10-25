import type { Metadata } from "next";
import { copy } from "@/content/it";
import { GamesView } from "@/features/games/games-view";

export const metadata: Metadata = { title: copy.games.title, description: copy.games.description };

export default function GamesPage() {
  return <GamesView />;
}
