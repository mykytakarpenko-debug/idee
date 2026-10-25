/**
 * Esportazione CSV compatibile con Excel in italiano (separatore ";", BOM UTF-8).
 * Le celle che iniziano con = + - @ vengono neutralizzate per prevenire la
 * "CSV injection" (formule eseguite all'apertura del file).
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

const SEPARATOR = ";";

function escapeCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  let value = String(raw);
  if (/^[=+\-@\t\r]/.test(value)) value = `'${value}`;
  if (/[";\n\r]/.test(value)) value = `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(SEPARATOR);
  const lines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(SEPARATOR),
  );
  return [header, ...lines].join("\r\n");
}

/** Avvia il download di un file nel browser. */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv<T>(
  filename: string,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
) {
  downloadFile(filename, `﻿${toCsv(rows, columns)}`, "text/csv;charset=utf-8");
}

/** Importi CSV in formato numerico italiano senza simbolo: 3850 → "38,50". */
export function csvAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
