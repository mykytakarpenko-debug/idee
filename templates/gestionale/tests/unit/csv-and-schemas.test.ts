import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { appointmentFormSchema, clientFormSchema, paymentFormSchema } from "@/lib/domain/schemas";
import { parseTags } from "@/lib/domain/clients";

describe("toCsv", () => {
  it("usa il punto e virgola ed esegue l'escape delle virgolette", () => {
    const csv = toCsv(
      [{ a: 'Taglio "classico"', b: "x;y" }],
      [
        { header: "A", value: (r) => r.a },
        { header: "B", value: (r) => r.b },
      ],
    );
    expect(csv).toBe('A;B\r\n"Taglio ""classico""";"x;y"');
  });

  it("neutralizza le formule (CSV injection)", () => {
    const csv = toCsv(
      [{ v: '=HYPERLINK("x")' }, { v: "+39 340" }],
      [{ header: "V", value: (r) => r.v }],
    );
    expect(csv.split("\r\n").slice(1)).toEqual(['"\'=HYPERLINK(""x"")"', "'+39 340"]);
  });
});

describe("validazione moduli", () => {
  const client = {
    firstName: "Anna",
    lastName: "Rossi",
    email: "",
    phone: "+39 340 000 0000",
    company: "",
    city: "",
    status: "active" as const,
    tags: "VIP, VIP, nuovo ",
    notes: "",
    marketingConsent: false,
  };

  it("accetta un cliente valido con email facoltativa", () => {
    expect(clientFormSchema.safeParse(client).success).toBe(true);
    expect(parseTags(client.tags)).toEqual(["VIP", "nuovo"]);
  });

  it("segnala email e telefono non validi", () => {
    const result = clientFormSchema.safeParse({ ...client, email: "anna@", phone: "abc" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["email", "phone"]));
  });

  it("converte durata e prezzo dell'appuntamento", () => {
    const result = appointmentFormSchema.parse({
      clientId: "cl_1",
      serviceId: "sv_1",
      staffId: "st_1",
      date: "2026-10-20",
      time: "09:30",
      durationMin: "45",
      price: "38,50",
      status: "confirmed",
      channel: "phone",
      notes: "",
    });
    expect(result.durationMin).toBe(45);
    expect(result.price).toBe(3850);
  });

  it("impedisce una scadenza precedente alla data del documento", () => {
    const result = paymentFormSchema.safeParse({
      clientId: "cl_1",
      appointmentId: "",
      description: "Piega",
      amount: "25",
      method: "card",
      status: "pending",
      issuedAt: "2026-10-20",
      dueAt: "2026-10-01",
      notes: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["dueAt"]);
  });
});
