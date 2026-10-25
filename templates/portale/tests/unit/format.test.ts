import { describe, expect, it } from "vitest";
import {
  centsToInput,
  formatCurrency,
  formatCurrencyCompact,
  formatDelta,
  formatDuration,
  parseEurosToCents,
} from "@/lib/format";

const normalize = (value: string) => value.replace(/ | /g, " ");

describe("parseEurosToCents", () => {
  it.each([
    ["38,50", 3850],
    ["38.50", 3850],
    ["38", 3800],
    ["1.234,5", 123450],
    ["1.234", 123400],
    ["0", 0],
    [" 12,00 € ", 1200],
  ])("converte %s in %i centesimi", (input, expected) => {
    expect(parseEurosToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "-5", "1,2,3"])("rifiuta %s", (input) => {
    expect(parseEurosToCents(input)).toBeNaN();
  });
});

describe("formattazione", () => {
  it("formatta le valute in italiano", () => {
    expect(normalize(formatCurrency(123450))).toBe("1234,50 €");
    expect(normalize(formatCurrency(1234500))).toBe("12.345,00 €");
    expect(normalize(formatCurrency(3850, { round: true }))).toBe("39 €");
  });

  it("usa la forma compatta per gli assi", () => {
    expect(formatCurrencyCompact(1_250_000)).toBe("12,5k €");
    expect(normalize(formatCurrencyCompact(50_000))).toBe("500 €");
  });

  it("mostra le variazioni con il segno", () => {
    expect(normalize(formatDelta(0.082))).toBe("+8,2%");
    expect(normalize(formatDelta(-0.05))).toBe("−5%");
  });

  it("formatta durate e importi modificabili", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
    expect(centsToInput(3850)).toBe("38,50");
  });
});
