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
  const normalizedText = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalizedText) return [];

  const lines = normalizedText
    .split("\n")
    .map((line) => line.replace(/^\uFEFF/, "").trim())
    .filter((line) => line.length > 0 && !/^sep\s*=\s*.+$/i.test(line));
  if (lines.length === 0) return [];

  const delimiterCandidates = [";", ",", "\t"];
  const delimiter = delimiterCandidates.reduce((best, candidate) => {
    const candidateCount = lines[0].split(candidate).length;
    const bestCount = lines[0].split(best).length;
    return candidateCount > bestCount ? candidate : best;
  }, ";");

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

export function parseGoogleSheetUrl(value: string) {
  const input = value.trim();
  if (!input) throw new Error("Link da planilha vazio.");

  const directIdMatch = input.match(/^[a-zA-Z0-9-_]{20,}$/);
  if (directIdMatch) {
    return { spreadsheetId: input, gid: "0" };
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Link do Google Sheets invalido.");
  }

  const spreadsheetId = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!spreadsheetId) {
    throw new Error("Nao encontrei o ID da planilha no link informado.");
  }

  const gid = url.searchParams.get("gid") || url.hash.match(/gid=(\d+)/)?.[1] || "0";
  return { spreadsheetId, gid };
}
