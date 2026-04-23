export type Tab = "clientes" | "despesas";

export interface Acesso {
  id: string;
  usuario: string;
  cliente: string;
  telefone: string;
  valor: number;
  app: string;
  vencimento: string;
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
}

export interface ImportFeedback {
  type: "success" | "error" | "info";
  message: string;
}
