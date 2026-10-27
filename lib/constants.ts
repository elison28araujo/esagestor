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
