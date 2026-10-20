/**
 * Disposizione degli eventi sovrapposti in una colonna del calendario.
 *
 * Gli eventi vengono raggruppati in "cluster" di sovrapposizioni transitive;
 * all'interno di ogni cluster ricevono la prima colonna libera. La larghezza
 * di ogni evento è 1 / numero di colonne del cluster.
 */
export interface LayoutInput {
  id: string;
  startMin: number;
  endMin: number;
}

export interface LayoutResult {
  id: string;
  column: number;
  columns: number;
}

export function layoutOverlappingEvents(events: readonly LayoutInput[]): Map<string, LayoutResult> {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const result = new Map<string, LayoutResult>();

  let cluster: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const columns = Math.max(1, columnEnds.length);
    for (const item of cluster) result.set(item.id, { id: item.id, column: item.column, columns });
    cluster = [];
    columnEnds = [];
  };

  for (const event of sorted) {
    if (event.startMin >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    // Prima colonna libera (l'evento precedente è terminato).
    let column = columnEnds.findIndex((end) => end <= event.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.endMin);
    } else {
      columnEnds[column] = event.endMin;
    }
    cluster.push({ id: event.id, column });
    clusterEnd = Math.max(clusterEnd, event.endMin);
  }
  flush();
  return result;
}
