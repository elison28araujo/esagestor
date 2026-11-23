import { ServidorNome } from "./types";

export const APP_OPTIONS = ["P2P", "OTT", "KPLAY", "XCLOUD", "OTT PLAYER", "XCLOUD PLAYER", "AB1ST"];

export interface RegraServidor {
  nome: ServidorNome;
  custoCredito: number;
  capacidadeTotal: number;
  maxP2P: number;
  maxIPTV: number;
  descricao: string;
}

export const SERVIDORES: Record<ServidorNome, RegraServidor> = {
  Warez: {
    nome: "Warez",
    custoCredito: 9.0,
    capacidadeTotal: 3,
    maxP2P: 1,
    maxIPTV: 2,
    descricao: "1 P2P e 2 IPTV (Até 3 clientes - R$ 9,00/crédito)",
  },
  Genial: {
    nome: "Genial",
    custoCredito: 7.0,
    capacidadeTotal: 2,
    maxP2P: 2,
    maxIPTV: 2,
    descricao: "2 IPTV ou 2 P2P (Até 2 clientes - R$ 7,00/crédito)",
  },
  Five: {
    nome: "Five",
    custoCredito: 8.0,
    capacidadeTotal: 2,
    maxP2P: 0,
    maxIPTV: 2,
    descricao: "2 IPTV (Até 2 clientes - R$ 8,00/crédito)",
  },
};

export const SERVIDOR_OPTIONS: ServidorNome[] = ["Warez", "Genial", "Five"];

export const FIELD_ALIASES = {
  usuario: ["usuario", "user", "login", "logins", "acesso", "conta"],
  cliente: ["cliente", "nome", "nome cliente", "assinante"],
  telefone: ["whatsapp", "what sapp", "telefone", "celular", "fone", "numero"],
  valor: ["valor", "vc", "v c", "mensalidade", "preco"],
  app: ["app", "aplicativo", "plataforma"],
  vencimento: ["vencimento", "data final", "final", "renovacao", "expira"],
  data: ["data", "data inicial", "inicio", "inicial", "cadastro"],
  enderecoMac: ["mac", "macaddress", "enderecomac", "endereco mac", "mac address"],
  chaveKey: ["key", "chavekey", "chave key", "chavekay", "chave kay", "kay"],
  servidor: ["servidor", "server", "painel"],
};

export const FALLBACK_COLUMNS = ["usuario", "cliente", "telefone", "valor", "app", "vencimento", "data", "enderecoMac", "chaveKey", "servidor"] as const;

export const DEFAULT_COBRANCA_MSG =
  "Olá {cliente}, seu acesso {app} venceu ou está próximo do vencimento. Deseja renovar? Valor: R$ {valor}.";

export const DEFAULT_RENOVACAO_MSG =
  "Olá {cliente}, sua assinatura do {app} foi renovada com sucesso! 🚀 Seu usuário é: {usuario}. O novo vencimento é: {vencimento}.";

export const DEFAULT_REATIVACAO_MSG =
  "Olá {cliente}, tudo bem? 😊 Notei que seu acesso do {app} venceu há um tempinho. Se quiser voltar a usar (Pix ou Cartão na hora), é só acessar: {link}";

export interface ModeloReativacao {
  id: string;
  titulo: string;
  estilo: "amigavel" | "praticidade" | "oferta" | "novidades" | "ultimo_aviso";
  texto: string;
}

export const REATIVACAO_TEMPLATES: ModeloReativacao[] = [
  {
    id: "amigavel",
    titulo: "Check-in Amigável",
    estilo: "amigavel",
    texto:
      "Olá, {cliente}! Tudo bem? 😊 Notei que seu acesso do {app} venceu há um tempinho. Aconteceu algum problema com o sinal ou aplicativo? Se quiser voltar a usar, deixei seu link rápido aqui (Pix ou Cartão na hora): {link}",
  },
  {
    id: "praticidade",
    titulo: "Pix & Cartão na Hora",
    estilo: "praticidade",
    texto:
      "E aí, {cliente}! Facilitamos tudo por aqui 🚀 Agora você mesmo reativa seu {app} em segundos pelo painel, no Pix ou Cartão de Crédito (R$ {valor}), sem precisar esperar atendimento: {link}",
  },
  {
    id: "oferta",
    titulo: "Condição de Retorno",
    estilo: "oferta",
    texto:
      "Oi, {cliente}! Tudo certo? Estamos com uma condição especial esta semana para ex-clientes voltarem para o {app}: reativando pelo valor normal (R$ {valor}), você ganha dias extras de bônus! 🎁 Acesse aqui: {link}",
  },
  {
    id: "novidades",
    titulo: "Novidades e Estabilidade",
    estilo: "novidades",
    texto:
      "Olá, {cliente}! Passando para avisar que fizemos várias atualizações no servidor e nos conteúdos do {app} — está muito mais rápido e estável. Querendo reativar (R$ {valor}), é só clicar aqui: {link}",
  },
  {
    id: "ultimo_aviso",
    titulo: "Limpeza de Cadastro",
    estilo: "ultimo_aviso",
    texto:
      "Olá, {cliente}! Estamos atualizando nossa lista de clientes do {app} e vi que seu acesso está inativo. Posso encerrar seu cadastro ou você pretende voltar? Para reativar agora: {link}",
  },
];

export interface ModeloPromocao {
  id: string;
  titulo: string;
  texto: string;
}

export const PROMOCOES_TEMPLATES: ModeloPromocao[] = [
  {
    id: "bf_completo",
    titulo: "Black Friday Completo",
    texto: `🔥🖤 *BLACK FRIDAY ESA PLAY – COMEÇOU!* 🖤🔥

🚨 Chegou a oportunidade de aproveitar condições especiais!

A ESA PLAY preparou uma promoção exclusiva para você que já é nosso cliente, para quem deseja renovar antecipadamente e também para quem quer voltar a aproveitar nossos serviços!

📺 *PLANOS ESPECIAIS BLACK FRIDAY:*

✅ 1 mês – R$ 27,00
✅ 2 meses – R$ 49,00
✅ 3 meses – R$ 63,00
✅ 6 meses – R$ 109,00
✅ 12 meses – R$ 199,00

🎬 Filmes e séries
⚽ Futebol e esportes
📡 Canais ao vivo
🌎 Conteúdos nacionais e internacionais

❤️ *JÁ É NOSSO CLIENTE?*
Aproveite para renovar ou antecipar sua mensalidade com os preços promocionais!

🔄 *JÁ FOI NOSSO CLIENTE?*
Essa é a oportunidade perfeita para voltar! Estamos esperando você de volta à ESA PLAY!

🆕 *AINDA NÃO É CLIENTE?*
Venha conhecer nossos planos e aproveite a Black Friday!

📅 Promoção válida de *15/11 a 30/11/2026*.

📲 Entre em contato pelo privado e consulte as condições!

🖤 *ESA PLAY – Seu entretenimento em um só lugar!*`,
  },
  {
    id: "bf_curto",
    titulo: "Black Friday Reativação",
    texto: `Olá! Tudo bem? 😊

Estamos passando para avisar que começou a *BLACK FRIDAY ESA PLAY!* 🖤🔥

Preparamos preços especiais e queremos dar a você a oportunidade de voltar a aproveitar nossos serviços!

Temos planos a partir de *R$ 27,00*.

Se tiver interesse em retornar, será um prazer receber você novamente!

📲 Responda esta mensagem e conheça nossas ofertas especiais.

*ESA PLAY – Estamos esperando você de volta!* ❤️`,
  },
];

export interface PlanoRenovacao {
  meses: number;
  label: string;
  valor: number;
  valorBasePlano?: number;
  valorAcordo?: number;
  destaque?: boolean;
}

export const BLACK_FRIDAY_INICIO = "2026-11-15T00:00:00-03:00";
export const BLACK_FRIDAY_FIM = "2026-11-30T23:59:59-03:00";

export const PLANOS_BLACK_FRIDAY: PlanoRenovacao[] = [
  { meses: 1, label: "1 mês", valor: 27.0 },
  { meses: 2, label: "2 meses", valor: 49.0 },
  { meses: 3, label: "3 meses", valor: 63.0, destaque: true },
  { meses: 6, label: "6 meses", valor: 109.0 },
  { meses: 12, label: "12 meses", valor: 199.0 },
];

export const PLANOS_BLACK_FRIDAY_POR_DISPOSITIVOS: Record<1 | 2 | 3, PlanoRenovacao[]> = {
  1: PLANOS_BLACK_FRIDAY,
  2: [
    { meses: 1, label: "1 mês", valor: 37.0 },
    { meses: 2, label: "2 meses", valor: 65.0 },
    { meses: 3, label: "3 meses", valor: 85.0, destaque: true },
    { meses: 6, label: "6 meses", valor: 145.0 },
    { meses: 12, label: "12 meses", valor: 259.0 },
  ],
  3: [
    { meses: 1, label: "1 mês", valor: 42.0 },
    { meses: 2, label: "2 meses", valor: 75.0 },
    { meses: 3, label: "3 meses", valor: 99.0, destaque: true },
    { meses: 6, label: "6 meses", valor: 179.0 },
    { meses: 12, label: "12 meses", valor: 319.0 },
  ],
};

export type BlackFridayPrecosPorDispositivos = Record<
  "1" | "2" | "3",
  Record<"1" | "2" | "3" | "6" | "12", number>
>;

export const DEFAULT_BLACK_FRIDAY_PRECOS: BlackFridayPrecosPorDispositivos = {
  "1": { "1": 27, "2": 49, "3": 63, "6": 109, "12": 199 },
  "2": { "1": 37, "2": 65, "3": 85, "6": 145, "12": 259 },
  "3": { "1": 42, "2": 75, "3": 99, "6": 179, "12": 319 },
};

export function normalizarBlackFridayPrecos(
  custom?: Partial<Record<string, Partial<Record<string, number>>>> | null
): BlackFridayPrecosPorDispositivos {
  const result: BlackFridayPrecosPorDispositivos = {
    "1": { ...DEFAULT_BLACK_FRIDAY_PRECOS["1"] },
    "2": { ...DEFAULT_BLACK_FRIDAY_PRECOS["2"] },
    "3": { ...DEFAULT_BLACK_FRIDAY_PRECOS["3"] },
  };
  if (!custom) return result;
  (["1", "2", "3"] as const).forEach((disp) => {
    const grupo = custom[disp];
    if (!grupo) return;
    (["1", "2", "3", "6", "12"] as const).forEach((mes) => {
      const val = Number(grupo[mes]);
      if (Number.isFinite(val) && val > 0) {
        result[disp][mes] = Number(val.toFixed(2));
      }
    });
  });
  return result;
}

export function normalizarDispositivos(dispositivos?: number): 1 | 2 | 3 {
  const n = Number(dispositivos) || 1;
  if (n >= 3) return 3;
  if (n === 2) return 2;
  return 1;
}

export function isPeriodoBlackFriday(agora = new Date()): boolean {
  return agora >= new Date(BLACK_FRIDAY_INICIO) && agora <= new Date(BLACK_FRIDAY_FIM);
}

export function obterPlanosDisponiveis(
  valorBaseAcesso: number,
  agora = new Date(),
  quantidadeAcessos = 1,
  dispositivos = 1,
  tabelaCustomizada?: Partial<Record<string, Partial<Record<string, number>>>> | null
): PlanoRenovacao[] {
  const base = Number(valorBaseAcesso) > 0 ? Number(valorBaseAcesso) : 35.0;
  const qtdDispositivos = normalizarDispositivos(dispositivos);
  if (isPeriodoBlackFriday(agora) && quantidadeAcessos === 1) {
    const tabela = PLANOS_BLACK_FRIDAY_POR_DISPOSITIVOS[qtdDispositivos];
    const customGrupo = tabelaCustomizada?.[String(qtdDispositivos)];
    return tabela.map((p) => {
      const customVal = customGrupo ? Number(customGrupo[String(p.meses)]) : 0;
      const precoTabela = Number.isFinite(customVal) && customVal > 0 ? Number(customVal.toFixed(2)) : p.valor;
      return {
        ...p,
        valor:
          qtdDispositivos === 1 && base < 27 && !(Number.isFinite(customVal) && customVal > 0)
            ? Math.min(precoTabela, Number((base * p.meses).toFixed(2)))
            : precoTabela,
      };
    });
  }
  return [
    { meses: 1, label: "1 mês", valor: base },
    { meses: 2, label: "2 meses", valor: Number((base * 2).toFixed(2)) },
    { meses: 3, label: "3 meses", valor: Number((base * 3).toFixed(2)) },
    { meses: 6, label: "6 meses", valor: Number((base * 6).toFixed(2)) },
    { meses: 12, label: "12 meses", valor: Number((base * 12).toFixed(2)) },
  ];
}

export function calcularValorPlano(
  mesesInput: number,
  valorBaseAcesso: number,
  agora = new Date(),
  quantidadeAcessos = 1,
  dispositivos = 1,
  tabelaCustomizada?: Partial<Record<string, Partial<Record<string, number>>>> | null
): { meses: number; valor: number } {
  const mesesValidos = [1, 2, 3, 6, 12];
  const meses = mesesValidos.includes(mesesInput) ? mesesInput : 1;
  const planos = obterPlanosDisponiveis(valorBaseAcesso, agora, quantidadeAcessos, dispositivos, tabelaCustomizada);
  const encontrado = planos.find((p) => p.meses === meses) || planos[0];
  return { meses: encontrado.meses, valor: encontrado.valor };
}

export function calcularResumoCombo<
  T extends { valor: number; valorCombo?: number }
>(acessos: T[]): {
  valorUnitarioTotal: number;
  valorComboTotal: number;
  economia: number;
  valoresPorAcesso: number[];
} {
  const ehCombo = acessos.length >= 2;
  const valoresPorAcesso = acessos.map((a) => {
    const unitario = Number(a.valor) || 0;
    const combo = Number(a.valorCombo) || 0;
    return ehCombo && combo > 0 ? combo : unitario;
  });
  const valorUnitarioTotal = Number(
    acessos.reduce((acc, a) => acc + (Number(a.valor) || 0), 0).toFixed(2)
  );
  const valorComboTotal = Number(
    valoresPorAcesso.reduce((acc, v) => acc + v, 0).toFixed(2)
  );
  const economia = Number(Math.max(0, valorUnitarioTotal - valorComboTotal).toFixed(2));
  return { valorUnitarioTotal, valorComboTotal, economia, valoresPorAcesso };
}

export function getValorAcordoAcesso(acesso?: { acordoAtivo?: boolean; acordoValor?: number } | null): number {
  if (!acesso?.acordoAtivo) return 0;
  const valor = Number(acesso.acordoValor || 0);
  return Number.isFinite(valor) && valor > 0 ? Number(valor.toFixed(2)) : 0;
}

export function aplicarAcordoNosPlanos(
  planos: PlanoRenovacao[],
  valorAcordoPendente = 0
): PlanoRenovacao[] {
  const acordo = Number.isFinite(valorAcordoPendente) && valorAcordoPendente > 0
    ? Number(valorAcordoPendente.toFixed(2))
    : 0;
  if (acordo <= 0) return planos;

  return planos.map((p) => ({
    ...p,
    valorBasePlano: p.valor,
    valorAcordo: acordo,
    valor: Number((p.valor + acordo).toFixed(2)),
  }));
}
