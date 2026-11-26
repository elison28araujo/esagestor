export type Tab = "dashboard" | "clientes" | "cadastro" | "despesas" | "caixa" | "servidores" | "configuracoes" | "pagamentos" | "licencas" | "suporte";
export type Filter = "todos" | "ativos" | "vencendo" | "vencidos" | "acordo" | "inativos15" | "inativos30" | "desativados";

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
  acordoAtivo?: boolean;
  acordoValor?: number;
  acordoData?: string;
  acordoObs?: string;
  desativado?: boolean;
  desativadoEm?: string;
}

export type MetodoPagamento = "pix" | "cartao" | "mercadopago" | "dinheiro";
export type TipoEntrada = "iptv" | "extra";
export type CategoriaEntradaExtra = "salario" | "caixa_inicial" | "extra";
export type CategoriaDespesa = "creditos" | "infraestrutura" | "marketing" | "pessoal" | "outros";
export type TipoDespesa = "operacao" | "retirada";

export interface Pagamento {
  id: string;
  acessoId: string;
  cliente: string;
  usuario: string;
  app: string;
  valor: number;
  data: string;
  userId: string;
  metodoPagamento?: MetodoPagamento | string;
  tipoEntrada?: TipoEntrada;
  categoriaEntrada?: CategoriaEntradaExtra | string;
}

export interface EntradaRecorrente {
  id: string;
  descricao: string;
  valor: number;
  categoria: CategoriaEntradaExtra | string;
  metodoPagamento: MetodoPagamento;
  diaRecebimento?: number;
}

export interface ServidorConfig {
  id: string;
  nome: string;
  valorCredito: number;
  estoqueCreditos: number;
  maxClientes: number;
  maxP2P?: number;
  maxIPTV?: number;
}

export interface UsuarioLinha {
  id: string;
  login: string;
  servidor: string;
  vencimento: string;
  creditoDescontadoNoCiclo: boolean;
  ultimoConsumoEm?: string;
  observacao?: string;
}

export interface ConsumoCredito {
  id: string;
  servidor: string;
  usuarioLogin: string;
  valor: number;
  quantidade: number;
  data: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  userId: string;
  categoria?: CategoriaDespesa | string;
  tipo?: TipoDespesa;
}

export interface DespesaRecorrente {
  id: string;
  descricao: string;
  valor: number;
  categoria: CategoriaDespesa | string;
  tipo: TipoDespesa;
  diaVencimento?: number;
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
