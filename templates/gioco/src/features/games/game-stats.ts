import { GAMES, slotStats, type SlotGame } from "@/lib/domain/slots";

/** Statistiche calcolate una volta sola (enumerazione completa dei rulli). */
export const GAME_STATS = new Map(GAMES.map((game) => [game.slug, slotStats(game)]));

export function statsOf(game: SlotGame) {
  return GAME_STATS.get(game.slug) ?? slotStats(game);
}
