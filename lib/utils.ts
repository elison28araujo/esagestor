export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string) {
  const number = normalizePhone(value).slice(0, 11);
  if (number.length <= 2) return number;
  if (number.length <= 7) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
  return `(${number.slice(0, 2)}) ${number.slice(2, 7)}-${number.slice(7)}`;
}

export function isValidPhone(value: string) {
  const number = normalizePhone(value);
  return number.length === 10 || number.length === 11;
}

export function toDateInput(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fromDateInput(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

export function parseFlexibleDate(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00`).toISOString();
  }

  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T12:00:00`).toISOString();
  }

  const serial = Number(raw.replace(",", "."));
  if (!Number.isNaN(serial) && serial > 20000 && serial < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)).toISOString();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString();
}

export function parseCsv(text: string) {
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalizedText) return [];

  const lines = normalizedText.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter =
    (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";

  return lines.map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  });
}

export function escapeCsvValue(value: string | number) {
  const stringValue = String(value ?? "");
  if (!/[",;\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}
