import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findGame, GAMES } from "@/lib/domain/slots";
import { SlotView } from "@/features/games/slot-view";

export function generateStaticParams() {
  return GAMES.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps<"/giochi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = findGame(slug);
  return game ? { title: game.name, description: game.tagline } : {};
}

export default async function GamePage({ params }: PageProps<"/giochi/[slug]">) {
  const { slug } = await params;
  const game = findGame(slug);
  if (!game) notFound();
  return <SlotView game={game} />;
}
