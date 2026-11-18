import { NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";

type EstiloMensagem =
  | "amigavel"
  | "praticidade"
  | "oferta"
  | "novidades"
  | "ultimo_aviso"
  | "variar";

const ESTILO_INSTRUCOES: Record<EstiloMensagem, string> = {
  amigavel:
    "Tom acolhedor e consultivo (check-in): pergunte se está tudo bem e se houve algum problema técnico com o app ou sinal, sem soar como cobrança agressiva.",
  praticidade:
    "Foque na praticidade: avise que a reativação leva segundos pelo link oficial com pagamento via Pix ou Cartão de Crédito, sem precisar esperar atendimento.",
  oferta:
    "Tom de oportunidade de retorno: convide o cliente a voltar destacando que vale a pena reativar agora (pode mencionar condição especial de retorno se o gestor quiser oferecer, sem inventar descontos numéricos específicos).",
  novidades:
    "Gere curiosidade positiva: comente que houve melhorias recentes de estabilidade e atualizações no serviço, convidando o cliente a testar novamente.",
  ultimo_aviso:
    "Mensagem curta e educada de atualização/limpeza de cadastro: pergunte se o cliente pretende voltar a usar ou se pode encerrar o cadastro por enquanto.",
  variar:
    "Reescreva a mensagem base mantendo exatamente o mesmo objetivo, informações e o link, mas com palavras e abertura diferentes para evitar mensagens repetitivas.",
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Token de autenticação ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token de autenticação inválido." }, { status: 401 });
    }

    let uid = "";
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json(
        { error: "Token de autenticação expirado ou inválido." },
        { status: 401 }
      );
    }

    let apiKey = process.env.GEMINI_API_KEY?.trim() || "";
    if (!apiKey && uid && adminDb) {
      try {
        const configSnap = await adminDb.collection("configuracoes").doc(uid).get();
        if (configSnap.exists) {
          apiKey = String(configSnap.data()?.geminiApiKey || "").trim();
        }
      } catch (err) {
        console.error("Erro ao buscar geminiApiKey no Firestore:", err);
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave do Gemini não configurada. Adicione em Configurações → IA (Gemini) ou na Vercel (GEMINI_API_KEY)." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const cliente = String(body?.cliente || "Cliente").slice(0, 80);
    const app = String(body?.app || "aplicativo").slice(0, 50);
    const valor = Number(body?.valor || 0);
    const diasVencido = Number(body?.diasVencido || 0);
    const linkPortal = String(body?.linkPortal || "").slice(0, 300);
    const mensagemBase = String(body?.mensagemBase || "").slice(0, 800);
    const estiloRaw = String(body?.estilo || "amigavel") as EstiloMensagem;
    const estilo: EstiloMensagem = estiloRaw in ESTILO_INSTRUCOES ? estiloRaw : "amigavel";

    const situacao =
      diasVencido > 0
        ? `Acesso vencido há ${diasVencido} dia(s).`
        : diasVencido === 0
          ? "Acesso vence hoje."
          : `Acesso vence em ${Math.abs(diasVencido)} dia(s).`;

    const prompt = [
      "Você é um assistente de atendimento no WhatsApp para um gestor de assinaturas de TV/streaming (ESAGestor).",
      "Escreva UMA única mensagem curta, natural e humana em português do Brasil para enviar ao cliente no WhatsApp.",
      "",
      "Regras obrigatórias:",
      "- Máximo de 3 a 4 linhas curtas, fáceis de ler no celular.",
      "- Use no máximo 1 ou 2 emojis discretos.",
      "- Não invente promoções numéricas ou promessas que não foram informadas.",
      `- Inclua exatamente este link no final ou no corpo da mensagem: ${linkPortal}`,
      "- Retorne APENAS o texto da mensagem pronta para enviar, sem aspas, sem títulos e sem explicações.",
      "",
      "Dados do cliente:",
      `- Nome: ${cliente}`,
      `- Aplicativo/Plano: ${app}`,
      `- Valor mensal: R$ ${valor.toFixed(2)}`,
      `- Situação: ${situacao}`,
      "",
      `Objetivo/Estilo: ${ESTILO_INSTRUCOES[estilo]}`,
      mensagemBase ? `\nMensagem de referência atual:\n${mensagemBase}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const modelos = [
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-flash-latest",
    ];

    let data: any = null;
    let lastStatus = 502;

    for (const modelo of modelos) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1024,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (geminiRes.ok) {
          data = await geminiRes.json();
          break;
        }

        lastStatus = geminiRes.status;
        // Se for erro de modelo indisponível (404/503), tenta o próximo modelo da lista
        if (lastStatus !== 404 && lastStatus !== 503) {
          console.error(`Erro na API Gemini (${modelo}):`, lastStatus);
          return NextResponse.json(
            { error: `Falha ao gerar mensagem com Gemini (status ${lastStatus}).` },
            { status: 502 }
          );
        }
      } catch (err) {
        console.warn(`Timeout/falha ao consultar modelo ${modelo}:`, err);
        lastStatus = 504;
      }
    }

    if (!data) {
      console.error("Nenhum modelo Gemini disponível retornou sucesso. Último status:", lastStatus);
      return NextResponse.json(
        { error: `Falha ao gerar mensagem com Gemini (status ${lastStatus}).` },
        { status: 502 }
      );
    }
    const textoGerado =
      data?.candidates?.[0]?.content?.parts
        ?.filter((p: { thought?: boolean }) => !p.thought)
        ?.map((p: { text?: string }) => p.text || "")
        .join("")
        .trim() || "";

    if (!textoGerado) {
      return NextResponse.json(
        { error: "O Gemini não retornou texto para a mensagem." },
        { status: 502 }
      );
    }

    return NextResponse.json({ mensagem: textoGerado });
  } catch (error) {
    console.error("Erro interno em /api/ia-mensagem:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar mensagem com IA." },
      { status: 500 }
    );
  }
}
