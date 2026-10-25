/** Punto di una serie temporale per i grafici. */
export interface SeriesPoint {
  key: string;
  /** Etichetta breve per l'asse. */
  label: string;
  /** Etichetta estesa per tooltip e lettori di schermo. */
  longLabel: string;
  value: number;
}
