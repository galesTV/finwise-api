import { Request, Response, NextFunction } from "express";
import { db } from "../services/firebase/firebase.service";
import { ApiError } from "../utils/apiError";

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const {
      type,
      amount,
      category,
      subcategory,
      date,
      paid,
      fixed,
      reminder,
      ignore,
      note,
      source,
      wallet,
    } = req.body;

    // Validação básica
    if (!type || !amount || !category || !date) {
      throw new ApiError(400, "Campos obrigatórios faltando");
    }

    const transactionData = {
      userId: req.user.uid,
      type,
      amount: Number(amount),
      category,
      subcategory: subcategory || null,
      date: new Date(date).toISOString(),
      paid: Boolean(paid),
      fixed: Boolean(fixed),
      reminder: Boolean(reminder),
      ignore: Boolean(ignore),
      note: note || "",
      source: source || "Outros",
      wallet: wallet || "Carteira",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("transactions").add(transactionData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...transactionData,
      },
    });
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(500, "Erro ao criar transação")
    );
  }
};

export const adicionarValorObjetivo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { objetivoId, valor } = req.body;

    if (!objetivoId || !valor) {
      throw new ApiError(400, "ID do objetivo e valor são obrigatórios");
    }

    if (valor <= 0) {
      throw new ApiError(400, "Valor deve ser maior que zero");
    }

    console.log("🎯 Processando adição de valor ao objetivo:", {
      objetivoId,
      valor,
      userId: req.user.uid,
    });

    // Buscar dados do usuário para verificar saldo
    const userDoc = await db.collection("usuarios").doc(req.user.uid).get();
    if (!userDoc.exists) {
      throw new ApiError(404, "Usuário não encontrado");
    }

    const userData = userDoc.data();
    const saldoAtual = userData?.saldo || 0;

    // Verificar se tem saldo suficiente
    if (Number(valor) > saldoAtual) {
      throw new ApiError(
        400,
        `Saldo insuficiente. Saldo atual: R$ ${saldoAtual.toFixed(2)}`
      );
    }

    // Buscar o objetivo
    const objetivoDoc = await db.collection("objetivos").doc(objetivoId).get();
    if (!objetivoDoc.exists) {
      throw new ApiError(404, "Objetivo não encontrado");
    }

    const objetivo = objetivoDoc.data();
    if (objetivo?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    // Verificar se não ultrapassa a meta
    const novoValorAtual = (objetivo.valorAtual || 0) + Number(valor);
    if (novoValorAtual > objetivo.valorMeta) {
      throw new ApiError(400, "Valor excede a meta do objetivo");
    }

    // Iniciar transação em lote
    const batch = db.batch();

    // Atualizar saldo do usuário
    const userRef = db.collection("usuarios").doc(req.user.uid);
    const novoSaldo = saldoAtual - Number(valor);
    batch.update(userRef, {
      saldo: novoSaldo,
      updatedAt: new Date().toISOString(),
    });

    // Atualizar objetivo
    const objetivoRef = db.collection("objetivos").doc(objetivoId);
    batch.update(objetivoRef, {
      valorAtual: novoValorAtual,
      updatedAt: new Date().toISOString(),
    });

    // Criar transação de despesa
    const transacaoRef = db.collection("transactions").doc();
    const transacaoData = {
      userId: req.user.uid,
      type: "expense",
      amount: Number(valor),
      category: "Objetivos",
      subcategory: objetivo.nome,
      date: new Date().toISOString(),
      paid: true,
      fixed: false,
      reminder: false,
      ignore: false,
      note: `Depósito no objetivo: ${objetivo.nome}`,
      source: "Objetivo",
      wallet: "Carteira",
      objetivoId: objetivoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(transacaoRef, transacaoData);

    // Executar transação em lote
    await batch.commit();

    console.log("✅ Valor adicionado ao objetivo com sucesso!");

    // Retornar resposta
    res.json({
      success: true,
      message: "Valor adicionado ao objetivo com sucesso",
      data: {
        objetivoId,
        valorAdicionado: Number(valor),
        novoValorAtual: novoValorAtual,
        saldoAnterior: saldoAtual,
        novoSaldo: novoSaldo,
        objetivo: {
          nome: objetivo.nome,
          meta: objetivo.valorMeta,
          progresso: (novoValorAtual / objetivo.valorMeta) * 100,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro em adicionarValorObjetivo:", error);
    next(error);
  }
};

export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    console.log(`Buscando transações para o usuário: ${req.user.uid}`); // Log para debug

    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    console.log(`Total de documentos encontrados: ${snapshot.size}`); // Log para debug

    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Garante que as datas sejam strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        date: data.date?.toDate?.()?.toISOString() || data.date,
      };
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Erro detalhado:", error); // Log mais detalhado
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof Error) {
      next(new ApiError(500, `Erro ao buscar transações: ${error.message}`));
    } else {
      next(new ApiError(500, "Erro desconhecido ao buscar transações"));
    }
  }
};

export const searchTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { query, startDate, endDate, type, category } = req.body;

    console.log("🔍 Buscando transações com filtros:", {
      userId: req.user.uid,
      query,
      startDate,
      endDate,
      type,
      category,
    });

    // ⚠️ CONSULTA SIMPLES - APENAS POR USUÁRIO, SEM ORDER BY
    // Isso NÃO exige índice composto
    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", req.user.uid)
      .get();

    console.log(`📊 Total de documentos encontrados: ${snapshot.size}`);

    // Mapear os dados
    let transactions: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      try {
        const transaction = {
          id: doc.id,
          userId: data.userId || "",
          type: data.type || "",
          amount: Number(data.amount) || 0,
          category: data.category || "",
          subcategory: data.subcategory || "",
          date:
            data.date?.toDate?.()?.toISOString() ||
            data.date ||
            new Date().toISOString(),
          paid: Boolean(data.paid),
          fixed: Boolean(data.fixed),
          reminder: Boolean(data.reminder),
          ignore: Boolean(data.ignore),
          note: data.note || "",
          source: data.source || "",
          wallet: data.wallet || "",
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() ||
            data.createdAt ||
            new Date().toISOString(),
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() ||
            data.updatedAt ||
            new Date().toISOString(),
        };
        transactions.push(transaction);
      } catch (error) {
        console.warn(`⚠️ Erro ao processar transação ${doc.id}:`, error);
      }
    });

    // 🔍 APLICAR TODOS OS FILTROS NO CÓDIGO JAVASCRIPT

    // Filtro por tipo
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
      console.log(`📊 Após filtro de tipo: ${transactions.length} transações`);
    }

    // Filtro por categoria
    if (category) {
      transactions = transactions.filter((t) => t.category === category);
      console.log(
        `📊 Após filtro de categoria: ${transactions.length} transações`
      );
    }

    // Filtro de busca textual
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      transactions = transactions.filter((t) => {
        const note = (t.note || "").toLowerCase();
        const category = (t.category || "").toLowerCase();
        const subcategory = (t.subcategory || "").toLowerCase();
        const source = (t.source || "").toLowerCase();

        const found =
          note.includes(searchTerm) ||
          category.includes(searchTerm) ||
          subcategory.includes(searchTerm) ||
          source.includes(searchTerm);

        return found;
      });
      console.log(`📊 Após busca textual: ${transactions.length} transações`);
    }

    // Filtro de data
    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter((t) => {
        try {
          const transactionDate = new Date(t.date);
          return transactionDate >= start;
        } catch {
          return false;
        }
      });
      console.log(
        `📊 Após filtro de data inicial: ${transactions.length} transações`
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      transactions = transactions.filter((t) => {
        try {
          const transactionDate = new Date(t.date);
          return transactionDate <= end;
        } catch {
          return false;
        }
      });
      console.log(
        `📊 Após filtro de data final: ${transactions.length} transações`
      );
    }

    // ⚠️ ORDENAR NO CÓDIGO - não no Firestore
    transactions.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch {
        return 0;
      }
    });

    console.log(
      `✅ Busca concluída: ${transactions.length} transações encontradas`
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("❌ Erro detalhado ao buscar transações:", error);

    // Log mais detalhado para debugging
    if (error instanceof Error) {
      console.error("❌ Stack trace:", error.stack);
      console.error("❌ Mensagem:", error.message);
    }

    next(new ApiError(500, "Erro interno ao buscar transações"));
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { id } = req.params;
    const doc = await db.collection("transactions").doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, "Transação não encontrada");
    }

    const transaction = doc.data();

    // Verifica se a transação pertence ao usuário
    if (transaction?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...transaction,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Erro ao buscar transação");
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "ID da transação não fornecido");
    }

    const transactionRef = db.collection("transactions").doc(id);
    const doc = await transactionRef.get();

    if (!doc.exists) {
      throw new ApiError(404, "Transação não encontrada"); // Isso será convertido para resposta 404
    }

    if (doc.data()?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    const allowedFields = ["amount", "type", "description", "category", "date"];
    const updateData: Record<string, any> = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "Nenhum campo válido fornecido para atualização");
    }

    updateData.updatedAt = new Date().toISOString();
    await transactionRef.update(updateData);
    const updatedDoc = await transactionRef.get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Preserva o status code original do erro
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Erro ao atualizar transação:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno ao atualizar transação",
      });
    }
  }
};

export const removeTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "ID da transação não fornecido");
    }

    const transactionRef = db.collection("transactions").doc(id);
    const doc = await transactionRef.get();

    // Verifica se a transação existe
    if (!doc.exists) {
      throw new ApiError(404, "Transação não encontrada");
    }

    // Verifica se o usuário é o dono da transação
    const transactionData = doc.data();
    if (transactionData?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    // Remove a transação
    await transactionRef.delete();

    // Resposta de sucesso sem conteúdo (204 No Content)
    res.status(204).send();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      console.error("Erro ao deletar transação:", error);
      next(new ApiError(500, "Erro ao deletar transação"));
    }
  }
};

export const getBalance = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const userId = req.user.uid;

    // Obtém todas as transações do usuário
    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", userId)
      .get();

    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.forEach((doc) => {
      const transaction = doc.data();
      const amount = Number(transaction.valor) || 0;

      if (transaction.tipo === "entrada") {
        totalIncome += amount;
      } else if (transaction.tipo === "saída") {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        balance,
        totalIncome,
        totalExpense,
        transactionCount: snapshot.size,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Erro ao calcular saldo");
  }
};

// Exportação para as rotas
export const TransactionController = {
  createTransaction,
  adicionarValorObjetivo,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  removeTransaction,
  getBalance,
  searchTransactions,
};
