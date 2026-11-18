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
