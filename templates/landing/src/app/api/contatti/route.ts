import { contactSchema, createRateLimiter, HONEYPOT_FIELD, isLikelySpam } from "@/lib/contact";

/**
 * Ricezione del modulo contatti.
 * - Valida di nuovo i dati con lo stesso schema del browser.
 * - Ai bot (campo trappola compilato o invio troppo rapido) risponde "ok" senza
 *   fare nulla, per non insegnare come aggirare il filtro.
 * - Limite indicativo di 5 richieste ogni 10 minuti per indirizzo IP.
 * - Non registra i dati personali nei log.
 */
const allow = createRateLimiter(5, 10 * 60_000);

export async function POST(request: Request) {
  // Su Vercel l'header è sempre presente; senza IP non si raggruppano richieste diverse.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip && !allow(ip, Date.now())) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (isLikelySpam({ honeypot: body[HONEYPOT_FIELD], elapsedMs: body.elapsedMs })) {
    return Response.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  // TODO(integrazione): invia la richiesta al CRM o via email (es. Resend con
  // RESEND_API_KEY) e, se `newsletter` è vero, avvia il double opt-in.
  return Response.json({ ok: true });
}
