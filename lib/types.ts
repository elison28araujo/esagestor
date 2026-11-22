export type Tab = "dashboard" | "clientes" | "cadastro" | "despesas" | "configuracoes" | "pagamentos" | "licencas" | "suporte";
export type Filter = "todos" | "ativos" | "vencendo" | "vencidos" | "inativos15" | "inativos30";

export interface MensagemSuporte {
  id: string;
  texto: string;
  remetente: "user" | "admin";
  remetenteEmail: string;
  timestamp: string;
  lida: boolean;
}

export interface ConversaSuporte {
  id: string;
  userId: string;
  userEmail: string;
  userWhatsapp?: string;
  ultimaMensagem: string;
  ultimaMensagemTimestamp: string;
  remetenteUltima: "user" | "admin";
  naoLidasAdmin: number;
  naoLidasUser: number;
  updatedAt: string;
}

export type ServidorNome = "Warez" | "Genial" | "Five";

export interface VagasDisponiveis {
  p2p: number;
  iptv: number;
  total: number;
  detalhes: string;
}

export interface TelaDispositivo {
  app: string;
  enderecoMac?: string;
  chaveKey?: string;
}

export interface Acesso {
  id: string;
  usuario: string;
  cliente: string;
  telefone: string;
  valor: number;
  valorCombo?: number;
  dispositivos?: number;
  dispositivosP2P?: number;
  dispositivosIPTV?: number;
  telas?: TelaDispositivo[];
  app: string;
  vencimento: string;
  data: string;
  userId: string;
  enderecoMac?: string;
  chaveKey?: string;
  servidor?: ServidorNome | string;
}

export interface Pagamento {
  id: string;
  acessoId: string;
  cliente: string;
  usuario: string;
  app: string;
  valor: number;
  data: string;
  userId: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  userId: string;
}

export interface UsuarioAgrupado {
  nome: string;
  clientes: Acesso[];
  temP2P: boolean;
  servidor: ServidorNome | string;
  capacidadeTotal: number;
  ocupadosTotal?: number;
  custoCredito: number;
  vagas: VagasDisponiveis;
  disponivel: boolean;
}

export interface ImportFeedback {
  type: "success" | "error" | "info";
  message: string;
}

export interface Configuracoes {
  id?: string;
  userId: string;
  mensagemCobranca: string;
  mensagemRenovacao: string;
  mensagemReativacao?: string;
  pixKey: string;
  pixNome: string;
  pixCidade: string;
  mpAccessToken: string;
  whatsappGestor: string;
}
