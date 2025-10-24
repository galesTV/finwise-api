// src/types/index.d.ts
export type TransactionType = 'entrada' | 'saída'; // Tipo reutilizável

export interface Transacao {
  id: string;
  userId: string;
  valor: number;
  tipo: TransactionType;
  categoria: string;
  descricao: string;
  data: Date;
  // Adicione se necessário:
  // recorrente?: boolean;
  // tags?: string[];
}

export interface Categoria {
  id: string;
  userId: string;
  nome: string;
  cor?: string;
  imagem?: string;
  // Adicione se necessário:
  // icone?: string;
  // orcamento?: number;
}

// Tipos para criação (sem ID)
export type TransacaoInput = Omit<Transacao, 'id'>;
export type CategoriaInput = Omit<Categoria, 'id'>;

// Tipo para atualização (todos campos opcionais, exceto ID)
export type TransacaoUpdate = Partial<TransacaoInput> & { id: string };
export type CategoriaUpdate = Partial<CategoriaInput> & { id: string };