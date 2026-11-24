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
  if (number.length <= 6) return `(${number.slice(0, 2)}) ${number.slice(2)}`;
  if (number.length <= 10) {
    return `(${number.slice(0, 2)}) ${number.slice(2, 6)}-${number.slice(6)}`;
  }
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

export function getApiUrl(path: string): string {
  const baseUrl = typeof window !== "undefined" && !window.location.origin.includes("localhost")
    ? ""
    : "https://www.esaplay.site";
  return `${baseUrl}${path}`;
}

export function isP2P(app: string | undefined): boolean {
  if (!app) return false;
  return app.trim().toUpperCase().includes("P2P");
}

/**
 * Extrai o login limpo de textos colados do painel (ex: "👤 Usuário: k9934w2 🔐 Senha: ...").
 */
export function extrairLoginUsuario(usuario: string | undefined): string {
  const raw = (usuario || "").trim();
  if (!raw) return "";
  const match = raw.match(/(?:usu[aá]rio|username|login)\s*:\s*([^\s🔒🔐|]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return raw;
}

export function detectarServidor(item: { servidor?: string; usuario?: string; app?: string }): "Warez" | "Genial" | "Five" {
  if (item.servidor) {
    const s = item.servidor.toLowerCase();
    if (s.includes("genial")) return "Genial";
    if (s.includes("five")) return "Five";
    if (s.includes("warez")) return "Warez";
  }
  if (item.usuario) {
    const u = item.usuario.toLowerCase();
    if (u.includes("genial")) return "Genial";
    if (u.includes("five")) return "Five";
    if (u.includes("warez")) return "Warez";
  }
  // Padrão Warez (retrocompatível com a base já cadastrada)
  return "Warez";
}

import { TelaDispositivo } from "./types";

export interface OcupacaoCliente {
  total: number;
  p2p: number;
  iptv: number;
}

/**
 * Ajusta o array de telas para a quantidade de dispositivos selecionada (1..3),
 * preservando os dados já preenchidos e dividindo nomes legados (ex: "P2P - OTT - HD PLAYER").
 */
export function ajustarTelasParaQuantidade(
  telasAtuais: TelaDispositivo[],
  quantidade: 1 | 2 | 3,
  fallback?: TelaDispositivo
): TelaDispositivo[] {
  const base: TelaDispositivo[] = [...telasAtuais];

  if (base.length === 0 && fallback) {
    const partesApp = fallback.app
      ? fallback.app.split(/\s*(?:\+|-|\/|,)\s*/).map((s) => s.trim()).filter(Boolean)
      : ["P2P"];

    for (let i = 0; i < quantidade; i++) {
      base.push({
        app: partesApp[i] || partesApp[0] || "P2P",
        enderecoMac: i === 0 ? fallback.enderecoMac || "" : "",
        chaveKey: i === 0 ? fallback.chaveKey || "" : "",
      });
    }
    return base.slice(0, quantidade);
  }

  while (base.length < quantidade) {
    base.push({ app: "OTT", enderecoMac: "", chaveKey: "" });
  }
  return base.slice(0, quantidade);
}

/**
 * Gera os campos resumidos compatíveis com o banco legado/CSV a partir da lista de telas.
 */
export function resumirTelasParaAcesso(telas: TelaDispositivo[]) {
  const limpas = telas.map((t) => ({
    app: (t.app || "P2P").trim().toUpperCase(),
    enderecoMac: (t.enderecoMac || "").trim(),
    chaveKey: (t.chaveKey || "").trim(),
  }));

  const appsTexto = limpas.map((t) => t.app).filter(Boolean);
  const appResumido = appsTexto.length > 0 ? appsTexto.join(" + ") : "P2P";
  const primeiroMac = limpas.find((t) => t.enderecoMac)?.enderecoMac || "";
  const primeiraKey = limpas.find((t) => t.chaveKey)?.chaveKey || "";
  const dispositivosP2P = limpas.filter((t) => isP2P(t.app)).length;
  const dispositivosIPTV = limpas.length - dispositivosP2P;

  return {
    app: appResumido,
    enderecoMac: primeiroMac,
    chaveKey: primeiraKey,
    dispositivosP2P,
    dispositivosIPTV,
    telas: limpas,
  };
}

export function calcularOcupacaoCliente(
  cliente: {
    app: string;
    dispositivos?: number;
    dispositivosP2P?: number;
    dispositivosIPTV?: number;
    telas?: TelaDispositivo[];
  },
  servidor: "Warez" | "Genial" | "Five"
): OcupacaoCliente {
  const dispositivos = Math.max(1, Number(cliente.dispositivos) || 1);

  if (Array.isArray(cliente.telas) && cliente.telas.length > 0) {
    const p2p = cliente.telas.filter((t) => isP2P(t.app)).length;
    const iptv = cliente.telas.length - p2p;
    return {
      total: Math.max(dispositivos, cliente.telas.length),
      p2p,
      iptv,
    };
  }

  if (
    typeof cliente.dispositivosP2P === "number" ||
    typeof cliente.dispositivosIPTV === "number"
  ) {
    const p2p = Math.max(0, Number(cliente.dispositivosP2P) || 0);
    const iptv = Math.max(0, Number(cliente.dispositivosIPTV) || 0);
    return {
      total: Math.max(dispositivos, p2p + iptv),
      p2p,
      iptv,
    };
  }

  const ehP2P = isP2P(cliente.app);
  if (dispositivos === 1) {
    return {
      total: 1,
      p2p: ehP2P ? 1 : 0,
      iptv: ehP2P ? 0 : 1,
    };
  }

  if (servidor === "Genial") {
    return {
      total: dispositivos,
      p2p: ehP2P ? dispositivos : 0,
      iptv: ehP2P ? 0 : dispositivos,
    };
  }

  if (servidor === "Five") {
    return {
      total: dispositivos,
      p2p: 0,
      iptv: dispositivos,
    };
  }

  // Warez: no máximo 1 P2P por usuário; dispositivos extras são IPTV
  const p2p = ehP2P ? 1 : 0;
  const iptv = Math.max(0, dispositivos - p2p);
  return {
    total: dispositivos,
    p2p,
    iptv,
  };
}

export function calcularVagasUsuario(
  nomeUsuario: string,
  clientes: Array<{
    app: string;
    servidor?: string;
    dispositivos?: number;
    dispositivosP2P?: number;
    dispositivosIPTV?: number;
    telas?: TelaDispositivo[];
  }>,
  servidorForcado?: "Warez" | "Genial" | "Five"
) {
  const servidorDefinido = clientes.find((c) => c.servidor)?.servidor as "Warez" | "Genial" | "Five" | undefined;
  const servidor = servidorForcado || servidorDefinido || detectarServidor({ usuario: nomeUsuario });

  const ocupacao = clientes.reduce(
    (acc, c) => {
      const uso = calcularOcupacaoCliente(c, servidor);
      acc.total += uso.total;
      acc.p2p += uso.p2p;
      acc.iptv += uso.iptv;
      return acc;
    },
    { total: 0, p2p: 0, iptv: 0 }
  );

  const total = ocupacao.total;
  const qtdP2P = ocupacao.p2p;
  const qtdIPTV = ocupacao.iptv;

  let vagasP2P = 0;
  let vagasIPTV = 0;
  let capacidadeTotal = 3;
  let custoCredito = 9.0;
  let detalhes = "";

  if (servidor === "Genial") {
    capacidadeTotal = 2;
    custoCredito = 7.0;
    if (qtdP2P > 0) {
      vagasP2P = Math.max(0, 2 - qtdP2P);
      vagasIPTV = 0;
      detalhes = vagasP2P > 0 ? `${vagasP2P} vaga${vagasP2P > 1 ? "s" : ""} P2P livre` : "Lotado";
    } else if (qtdIPTV > 0) {
      vagasIPTV = Math.max(0, 2 - qtdIPTV);
      vagasP2P = 0;
      detalhes = vagasIPTV > 0 ? `${vagasIPTV} vaga${vagasIPTV > 1 ? "s" : ""} IPTV livre` : "Lotado";
    } else {
      vagasP2P = 2;
      vagasIPTV = 2;
      detalhes = "2 vagas livres (2 IPTV ou 2 P2P)";
    }
  } else if (servidor === "Five") {
    capacidadeTotal = 2;
    custoCredito = 8.0;
    vagasP2P = 0;
    vagasIPTV = Math.max(0, 2 - qtdIPTV);
    detalhes = vagasIPTV > 0 ? `${vagasIPTV} vaga${vagasIPTV > 1 ? "s" : ""} IPTV livre` : "Lotado";
  } else {
    // Warez (padrão)
    capacidadeTotal = 3;
    custoCredito = 9.0;
    vagasP2P = Math.max(0, 1 - qtdP2P);
    vagasIPTV = Math.max(0, 2 - qtdIPTV);
    const partes: string[] = [];
    if (vagasP2P > 0) partes.push(`${vagasP2P} P2P`);
    if (vagasIPTV > 0) partes.push(`${vagasIPTV} IPTV`);
    detalhes = partes.length > 0 ? `${partes.join(" e ")} livre${partes.length > 1 || vagasIPTV > 1 ? "s" : ""}` : "Lotado";
  }

  const vagasTotal = Math.max(0, capacidadeTotal - total);
  const disponivel = vagasTotal > 0 && (vagasP2P > 0 || vagasIPTV > 0);

  return {
    servidor,
    capacidadeTotal,
    ocupadosTotal: total,
    custoCredito,
    vagas: {
      p2p: vagasP2P,
      iptv: vagasIPTV,
      total: vagasTotal,
      detalhes,
    },
    disponivel,
  };
}

/**
 * Monta o payload de atualização ao adicionar +1 tela (ex: +R$ 10,00 na próxima mensalidade).
 */
export function montarUpgradeTela(
  acesso: {
    app: string;
    dispositivos?: number;
    valor: number;
    enderecoMac?: string;
    chaveKey?: string;
    telas?: TelaDispositivo[];
  },
  novaTela: TelaDispositivo,
  acrescimoValor = 10
) {
  const qtdAtual = Math.max(1, Math.min(3, Number(acesso.dispositivos) || 1)) as 1 | 2 | 3;
  const novaQtd = Math.min(3, qtdAtual + 1) as 1 | 2 | 3;
  const telasBase = ajustarTelasParaQuantidade(acesso.telas || [], qtdAtual, {
    app: acesso.app,
    enderecoMac: acesso.enderecoMac,
    chaveKey: acesso.chaveKey,
  });

  const telasAtualizadas = [
    ...telasBase,
    {
      app: (novaTela.app || "OTT PLAYER").trim().toUpperCase(),
      enderecoMac: (novaTela.enderecoMac || "").trim(),
      chaveKey: (novaTela.chaveKey || "").trim(),
    },
  ].slice(0, novaQtd);

  const resumo = resumirTelasParaAcesso(telasAtualizadas);
  const valorAtual = Number(acesso.valor) || 0;
  const novoValor = Number((valorAtual + Math.max(0, Number(acrescimoValor) || 0)).toFixed(2));

  return {
    dispositivos: novaQtd,
    valor: novoValor,
    ...resumo,
  };
}

export function formatarMensagemUpgrade(
  template: string,
  dados: { cliente: string; usuario: string; valorAtual: number; acrescimo: number }
): string {
  const valorNovo = Number((dados.valorAtual + dados.acrescimo).toFixed(2));
  return template
    .replace(/\{cliente\}/g, dados.cliente)
    .replace(/\{usuario\}/g, dados.usuario)
    .replace(/\{valor_atual\}/g, dados.valorAtual.toFixed(2).replace(".", ","))
    .replace(/\{valor_novo\}/g, valorNovo.toFixed(2).replace(".", ","))
    .replace(/\{acrescimo\}/g, dados.acrescimo.toFixed(2).replace(".", ","));
}

export interface InfoUpgradeProporcional {
  diasRestantes: number;
  mesesRestantes: number;
  isLongoPrazo: boolean;
  valorProporcional: number;
  vencimentoFormatado: string;
}

export function calcularUpgradeProporcional(
  vencimentoIso: string,
  acrescimoMensal: number,
  agoraMs = Date.now()
): InfoUpgradeProporcional {
  const vencMs = new Date(vencimentoIso).getTime();
  const diasRestantes = Number.isNaN(vencMs)
    ? 0
    : Math.max(0, Math.ceil((vencMs - agoraMs) / (1000 * 60 * 60 * 24)));
  const isLongoPrazo = diasRestantes > 40;
  const mesesRestantes = Math.max(1, Math.round(diasRestantes / 30));
  const valorProporcional = Number((mesesRestantes * Math.max(0, acrescimoMensal)).toFixed(2));
  const vencimentoFormatado = Number.isNaN(vencMs)
    ? ""
    : new Date(vencMs).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return {
    diasRestantes,
    mesesRestantes,
    isLongoPrazo,
    valorProporcional,
    vencimentoFormatado,
  };
}

export function formatarMensagemUpgradeLongoPrazo(
  dados: { cliente: string; valorAtual: number; acrescimo: number; vencimento: string },
  agoraMs = Date.now()
): string {
  const info = calcularUpgradeProporcional(dados.vencimento, dados.acrescimo, agoraMs);
  const valorNovo = Number((dados.valorAtual + dados.acrescimo).toFixed(2));
  const pluralMes = info.mesesRestantes === 1 ? "mês" : "meses";

  return (
    `Olá ${dados.cliente}! 🎉 Como você já garantiu seu plano até *${info.vencimentoFormatado}*, liberamos uma oferta exclusiva: ` +
    `quer adicionar *mais 1 dispositivo (outra TV ou celular)* no seu acesso por apenas *+R$ ${dados.acrescimo.toFixed(2).replace(".", ",")}/mês*? ` +
    `Como ainda faltam *${info.mesesRestantes} ${pluralMes}* para sua próxima renovação, você pode liberar hoje pagando apenas o proporcional de ` +
    `*R$ ${info.valorProporcional.toFixed(2).replace(".", ",")}* pelo período restante (e na renovação passa de R$ ${dados.valorAtual.toFixed(2).replace(".", ",")} para R$ ${valorNovo.toFixed(2).replace(".", ",")}). ` +
    `Quer que eu libere agora?`
  );
}

export const CUSTO_SERVIDOR_PADRAO: Record<"Warez" | "Five" | "Genial", number> = {
  Warez: 9.0,
  Five: 8.0,
  Genial: 7.0,
};

export interface ResumoLucroServidor {
  servidor: "Warez" | "Five" | "Genial";
  linhas: number;
  clientes: number;
  custoUnitario: number;
  receitaPrevista: number;
  custoTotal: number;
  lucroPrevisto: number;
  margem: number;
}

export interface ResultadoLucroServidores {
  porServidor: Record<"Warez" | "Five" | "Genial", ResumoLucroServidor>;
  totais: {
    linhas: number;
    clientes: number;
    receitaPrevista: number;
    custoTotal: number;
    lucroPrevisto: number;
    margem: number;
  };
}

/**
 * Calcula a previsão de lucro mensal com base no custo de crédito por servidor
 * (Warez = R$ 9,00 | Five = R$ 8,00 | Genial = R$ 7,00) e na receita das linhas.
 */
export function calcularLucroPorServidor(
  grupos: Array<{
    servidor?: string;
    clientes: Array<{ valor?: number }>;
  }>,
  custosCustomizados?: Partial<Record<"Warez" | "Five" | "Genial", number>>
): ResultadoLucroServidores {
  const custos = {
    Warez: Number(custosCustomizados?.Warez ?? CUSTO_SERVIDOR_PADRAO.Warez),
    Five: Number(custosCustomizados?.Five ?? CUSTO_SERVIDOR_PADRAO.Five),
    Genial: Number(custosCustomizados?.Genial ?? CUSTO_SERVIDOR_PADRAO.Genial),
  };

  const criarBase = (servidor: "Warez" | "Five" | "Genial"): ResumoLucroServidor => ({
    servidor,
    linhas: 0,
    clientes: 0,
    custoUnitario: custos[servidor],
    receitaPrevista: 0,
    custoTotal: 0,
    lucroPrevisto: 0,
    margem: 0,
  });

  const porServidor: Record<"Warez" | "Five" | "Genial", ResumoLucroServidor> = {
    Warez: criarBase("Warez"),
    Five: criarBase("Five"),
    Genial: criarBase("Genial"),
  };

  grupos.forEach((grupo) => {
    const srv: "Warez" | "Five" | "Genial" =
      grupo.servidor === "Five"
        ? "Five"
        : grupo.servidor === "Genial"
          ? "Genial"
          : "Warez";

    const receitaGrupo = grupo.clientes.reduce(
      (sum, c) => sum + (Number(c.valor) || 0),
      0
    );

    porServidor[srv].linhas += 1;
    porServidor[srv].clientes += grupo.clientes.length;
    porServidor[srv].receitaPrevista += receitaGrupo;
  });

  let totalLinhas = 0;
  let totalClientes = 0;
  let totalReceita = 0;
  let totalCusto = 0;

  (["Warez", "Five", "Genial"] as const).forEach((srv) => {
    const item = porServidor[srv];
    item.receitaPrevista = Number(item.receitaPrevista.toFixed(2));
    item.custoTotal = Number((item.linhas * item.custoUnitario).toFixed(2));
    item.lucroPrevisto = Number((item.receitaPrevista - item.custoTotal).toFixed(2));
    item.margem = item.receitaPrevista > 0
      ? Number(((item.lucroPrevisto / item.receitaPrevista) * 100).toFixed(1))
      : 0;

    totalLinhas += item.linhas;
    totalClientes += item.clientes;
    totalReceita += item.receitaPrevista;
    totalCusto += item.custoTotal;
  });

  const receitaTotalArred = Number(totalReceita.toFixed(2));
  const custoTotalArred = Number(totalCusto.toFixed(2));
  const lucroTotalArred = Number((receitaTotalArred - custoTotalArred).toFixed(2));

  return {
    porServidor,
    totais: {
      linhas: totalLinhas,
      clientes: totalClientes,
      receitaPrevista: receitaTotalArred,
      custoTotal: custoTotalArred,
      lucroPrevisto: lucroTotalArred,
      margem: receitaTotalArred > 0
        ? Number(((lucroTotalArred / receitaTotalArred) * 100).toFixed(1))
        : 0,
    },
  };
}
