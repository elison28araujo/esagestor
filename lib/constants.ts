export const APP_OPTIONS = ["P2P", "OTT", "KPLAY", "XCLOUD", "OTT PLAYER", "XCLOUD PLAYER", "AB1ST"];

export const FIELD_ALIASES = {
  usuario: ["usuario", "user", "login", "logins", "acesso", "conta"],
  cliente: ["cliente", "nome", "nome cliente", "assinante"],
  telefone: ["whatsapp", "what sapp", "telefone", "celular", "fone", "numero"],
  valor: ["valor", "vc", "v c", "mensalidade", "preco"],
  app: ["app", "aplicativo", "plataforma"],
  vencimento: ["vencimento", "data final", "final", "renovacao", "expira"],
  data: ["data", "data inicial", "inicio", "inicial", "cadastro"],
};

export const FALLBACK_COLUMNS = ["usuario", "cliente", "telefone", "valor", "app", "vencimento", "data"] as const;

export const DEFAULT_COBRANCA_MSG =
  "Olá {cliente}, seu acesso {app} venceu ou está próximo do vencimento. Deseja renovar? Valor: R$ {valor}.";
