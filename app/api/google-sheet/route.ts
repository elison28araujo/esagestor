import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseGoogleSheetUrl(value: string) {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    const { spreadsheetId, gid } = parseGoogleSheetUrl(body.url || "");

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const response = await fetch(exportUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Nao foi possivel baixar a planilha. Verifique se ela esta publica.");
    }

    const csv = await response.text();

    if (!csv.trim()) {
      throw new Error("A planilha retornou vazia.");
    }

    return NextResponse.json({
      csv,
      sourceLabel: `Google Sheets (gid ${gid})`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao ler a planilha do Google Sheets.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
