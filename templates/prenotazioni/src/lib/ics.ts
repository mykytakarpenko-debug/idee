/** Genera un evento iCalendar (.ics) compatibile con Google, Apple e Outlook. */
function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/[,;]/g, (m) => `\\${m}`);
}

export function createIcsEvent(event: {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  location: string;
  description: string;
}): string {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Agenda//Appuntamenti//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(event.start)}`,
      `DTEND:${stamp(event.end)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `LOCATION:${escapeText(event.location)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}
