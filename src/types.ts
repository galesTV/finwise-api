import { Timestamp } from "@firebase/firestore";

export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Home: undefined;
  Wallet: undefined;
  Payments: { tipo: 'pagamentos' | 'despesasFixas' }; 
  EndCadastre: undefined;
  User: undefined;
  Graphics: undefined;
  HistoryScreen: undefined;
  ReceitaScreen: {
    edit: boolean;
    transacaoData?: TransacaoFirebase | TransacaoItem;
  };
  DespesaScreen: {
    edit: boolean;
    transacaoData?: TransacaoFirebase | TransacaoItem;
  };
}

// Tipo para transações do Firebase (usado nas operações CRUD)
export type TransacaoFirebase = {
  id?: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: any; // Pode ser Timestamp ou Date
  state: 'pago' | 'pendente';
  lembrete?: string | null;
  observacao?: string | null;
  fixa: boolean;
  ignorar: boolean;
  userId?: string;
  createdAt?: string;
};;

// Tipo para itens de transação na UI (usado na listagem)
export type TransacaoItem = {
  id: string;
  type: 'item';
  category: string;
  source?: string;
  wallet: string;
  amount: string;
  transacao: 'receita' | 'despesa';
  state: 'pago' | 'pendente';
  data: string;
  lembrete?: string;
  observacao?: string;
};

// Função para converter entre os tipos
export function converterParaTransacaoItem(transacao: TransacaoFirebase): TransacaoItem {
  const data = transacao.data instanceof Timestamp ? transacao.data.toDate() : new Date(transacao.data);
  return {
    id: transacao.id || '',
    type: 'item',
    category: transacao.descricao,
    source: transacao.categoria,
    wallet: 'Carteira',
    amount: `R$ ${transacao.valor.toFixed(2)}`,
    transacao: transacao.tipo === 'entrada' ? 'receita' : 'despesa',
    state: transacao.state,
    data: `${data.getDate()}_${data.getMonth() + 1}_${data.getFullYear()}`,
    lembrete: transacao.lembrete || undefined,
    observacao: transacao.observacao || undefined
  };
}

export function converterDeTransacaoItem(item: TransacaoItem): TransacaoFirebase {
  const [day, month, year] = item.data.split('_');
  return {
    id: item.id,
    descricao: item.category,
    categoria: item.source || 'Outros',
    valor: parseFloat(item.amount.replace('R$ ', '').replace(',', '.')),
    tipo: item.transacao === 'receita' ? 'entrada' : 'saida',
    data: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
    state: item.state,
    lembrete: item.lembrete || null,
    observacao: item.observacao || null,
    fixa: false,
    ignorar: false
  };
}

// Extendendo os tipos do React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}