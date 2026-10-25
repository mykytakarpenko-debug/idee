import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import { GAMES, SYMBOLS } from "@/lib/domain/slots";
import { formatCurrency, formatPercent } from "@/lib/format";
import { LegalPage } from "@/components/site/legal-page";
import { statsOf } from "@/features/games/game-stats";

export const metadata: Metadata = { title: copy.rules.title, description: copy.rules.description };

const s = DEMO_SETTINGS;

/** Regolamento sintetico e probabilità di vincita (informazione obbligatoria per il gioco pubblico). */
export default function RulesPage() {
  return (
    <LegalPage title={copy.rules.title}>
      <h2>Scommesse a quota fissa</h2>
      <ul>
        <li>
          La quota è quella accettata al momento della giocata e resta fissa anche se poi cambia.
        </li>
        <li>
          Importo da {formatCurrency(s.minStake)} a {formatCurrency(s.maxStake)} per schedina, fino
          a {s.maxLines} eventi; non si possono combinare due esiti dello stesso evento.
        </li>
        <li>
          Vincita potenziale = importo × quota totale (prodotto delle quote), fino a un massimo di{" "}
          {formatCurrency(s.maxWin)}.
        </li>
        <li>
          Se un evento è annullato il suo esito vale quota 1; se tutti gli eventi sono annullati
          l&apos;importo è rimborsato.
        </li>
        <li>Le scommesse sono liquidate dopo il risultato ufficiale dell&apos;evento.</li>
      </ul>

      <h2>Probabilità di vincita nelle scommesse</h2>
      <p>
        Una quota esprime la probabilità stimata dall&apos;operatore, ridotta del suo margine: la
        probabilità implicita è 1 ÷ quota. Una quota di 2,00 corrisponde al 50%, una di 4,00 al 25%.
        La somma delle probabilità implicite di un mercato supera il 100%: la differenza è il
        margine dell&apos;operatore (circa il 6% in questa demo).
      </p>
      <p>
        In una multipla le probabilità si moltiplicano: tre esiti al 50% hanno insieme il 12,5% di
        probabilità.
      </p>

      <h2>Giochi</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Gioco</th>
            <th scope="col">Ritorno teorico (RTP)</th>
            <th scope="col">Combinazioni vincenti</th>
            <th scope="col">Vincita massima</th>
          </tr>
        </thead>
        <tbody>
          {GAMES.map((game) => {
            const st = statsOf(game);
            return (
              <tr key={game.slug}>
                <td>{game.name}</td>
                <td>{formatPercent(st.rtp, 2)}</td>
                <td>{formatPercent(st.hitRate, 1)}</td>
                <td>{st.maxMultiplier}× la puntata</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>
        L&apos;RTP indica quanto, in media e su un numero molto alto di giocate, torna ai giocatori
        di quanto giocato: con un RTP del 95% si perdono in media 5 centesimi per ogni euro. Le
        regole italiane richiedono un RTP non inferiore al 90% per i giochi di questo tipo. I
        simboli sono:{" "}
        {Object.values(SYMBOLS)
          .map((x) => x.label.toLowerCase())
          .join(", ")}
        .
      </p>
      <p>
        Il risultato di ogni giocata è casuale e indipendente dalle precedenti: non esistono
        strategie per aumentare la probabilità di vincita, né momenti in cui una slot &quot;deve
        pagare&quot;.
      </p>
    </LegalPage>
  );
}
