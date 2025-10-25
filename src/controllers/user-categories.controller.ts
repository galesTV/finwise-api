import { Request, Response, NextFunction } from "express";
import { db } from "../services/firebase/firebase.service";
import { ApiError } from "../utils/apiError";

// Cache em memória
const userCategoriesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

export const getUserCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const cacheKey = `user_categories_${req.user.uid}`;
    const cached = userCategoriesCache.get(cacheKey);

    // Retorna do cache se ainda for válido
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        cached: true,
      });
    }

    const doc = await db.collection("user_categories").doc(req.user.uid).get();

    if (!doc.exists) {
      // Usuário ainda não tem categorias configuradas
      const emptyCategories = {
        variavel: [],
        fixa: [],
        salario: 0,
        diaRecebimento: null,
        ultimoRecebimento: null,
      };

      return res.status(200).json({
        success: true,
        data: emptyCategories,
        cached: false,
      });
    }

    const categoriesData = doc.data();

    // Atualiza cache
    userCategoriesCache.set(cacheKey, {
      data: categoriesData,
      timestamp: Date.now(),
    });

    res.status(200).json({
      success: true,
      data: categoriesData,
      cached: false,
    });
  } catch (error) {
    console.error("Erro ao buscar categorias do usuário:", error);
    next(new ApiError(500, "Erro ao buscar categorias"));
  }
};

export const saveUserCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { categorias, salario, diaRecebimento } = req.body;

    if (!categorias || !salario || !diaRecebimento) {
      throw new ApiError(400, "Dados incompletos para salvar categorias");
    }

    const userCategoriesData = {
      userId: req.user.uid,
      categorias: {
        variavel: categorias.variavel || [],
        fixa: categorias.fixa || [],
      },
      salario: Number(salario),
      diaRecebimento: Number(diaRecebimento),
      ultimoRecebimento: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Salva no Firestore
    await db
      .collection("user_categories")
      .doc(req.user.uid)
      .set(userCategoriesData, { merge: true });

    // Limpa cache
    userCategoriesCache.delete(`user_categories_${req.user.uid}`);

    res.status(200).json({
      success: true,
      message: "Categorias salvas com sucesso",
      data: userCategoriesData,
    });
  } catch (error) {
    console.error("Erro ao salvar categorias:", error);
    next(new ApiError(500, "Erro ao salvar categorias"));
  }
};

export const checkSalaryPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const doc = await db.collection("user_categories").doc(req.user.uid).get();

    if (!doc.exists) {
      return res.status(200).json({
        success: true,
        shouldReceive: false,
        message: "Usuário não configurou salário",
      });
    }

    const userData = doc.data();

    // VERIFICAÇÃO ADICIONADA PARA EVITAR ERROS
    if (
      !userData ||
      userData.diaRecebimento === undefined ||
      userData.salario === undefined
    ) {
      return res.status(200).json({
        success: true,
        shouldReceive: false,
        message: "Dados de salário incompletos",
      });
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    const lastPayment = userData.ultimoRecebimento
      ? new Date(userData.ultimoRecebimento)
      : null;

    // Verifica se é dia de receber e se já não recebeu este mês
    // ADICIONE VERIFICAÇÕES ADICIONAIS PARA userData
    const diaRecebimento = userData.diaRecebimento || 0;
    const salario = userData.salario || 0;

    const shouldReceive =
      dayOfMonth === diaRecebimento &&
      (!lastPayment || lastPayment.getMonth() !== today.getMonth());

    res.status(200).json({
      success: true,
      shouldReceive,
      salario: salario,
      diaRecebimento: diaRecebimento,
    });
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    next(new ApiError(500, "Erro ao verificar pagamento"));
  }
};

export const updateLastPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    await db.collection("user_categories").doc(req.user.uid).update({
      ultimoRecebimento: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Data do último recebimento atualizada",
    });
  } catch (error) {
    console.error("Erro ao atualizar último recebimento:", error);
    next(new ApiError(500, "Erro ao atualizar data de recebimento"));
  }
};

export const updateSubcategoryInUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { categoryId, subcategoryName, updates } = req.body;

    // Busca o documento do usuário
    const userDoc = await db
      .collection("user_categories")
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists) {
      throw new ApiError(404, "Categorias do usuário não encontradas");
    }

    const userData = userDoc.data();

    // VERIFICAÇÃO ADICIONAL PARA userData
    if (!userData || !userData.categorias) {
      throw new ApiError(404, "Estrutura de categorias inválida");
    }

    const categorias = [
      ...userData.categorias.variavel,
      ...userData.categorias.fixa,
    ];

    // Encontra e atualiza a categoria
    const categoriaIndex = categorias.findIndex((cat) => cat.id === categoryId);
    if (categoriaIndex === -1) {
      throw new ApiError(404, "Categoria não encontrada");
    }

    // ADICIONE TIPAGEM AO PARÂMETRO 'sub'
    categorias[categoriaIndex].subcategorias = categorias[
      categoriaIndex
    ].subcategorias.map((sub: any) =>
      sub.name === subcategoryName ? { ...sub, ...updates } : sub
    );

    // Atualiza no Firestore
    await db
      .collection("user_categories")
      .doc(req.user.uid)
      .update({
        categorias: {
          variavel: categorias.filter((cat) => cat.tipo === "variavel"),
          fixa: categorias.filter((cat) => cat.tipo === "fixa"),
        },
        updatedAt: new Date().toISOString(),
      });

    res.status(200).json({
      success: true,
      message: "Subcategoria atualizada com sucesso",
    });
  } catch (error) {
    console.error("Error updating subcategory in user categories:", error);
    next(new ApiError(500, "Erro ao atualizar subcategoria"));
  }
};

export const processFixedExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const userId = req.user.uid;
    const today = new Date();

    // Busca categorias do usuário
    const userDoc = await db.collection("user_categories").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(200).json({
        success: true,
        processed: 0,
        message: "Nenhuma categoria encontrada",
      });
    }

    const userData = userDoc.data();
    const fixedCategories = userData?.categorias?.fixa || [];

    let processedCount = 0;

    for (const category of fixedCategories) {
      if (category.nome === "Adicione") continue;

      for (const subcategory of category.subcategorias || []) {
        // Só processa se for uma despesa fixa configurada
        if (subcategory.isFixed && subcategory.frequency) {
          const shouldProcess = await shouldProcessFixedExpense(
            subcategory,
            category,
            today,
            userId
          );

          if (shouldProcess) {
            await processSingleFixedExpense(userId, category, subcategory);
            processedCount++;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      processed: processedCount,
      message: `${processedCount} despesas fixas processadas`,
    });
  } catch (error) {
    console.error("Erro ao processar despesas fixas:", error);
    next(new ApiError(500, "Erro ao processar despesas fixas"));
  }
};

async function processSingleFixedExpense(
  userId: string,
  category: any,
  subcategory: any
): Promise<void> {
  const batch = db.batch();
  const today = new Date();

  // Busca saldo atual do usuário
  const userRef = db.collection("usuarios").doc(userId);
  const userSnapshot = await userRef.get();
  const saldoAtual = userSnapshot.data()?.saldo || 0;

  // Cria transação
  const transactionRef = db.collection("transactions").doc();
  const transactionData = {
    userId: userId,
    type: "expense",
    amount: subcategory.limit,
    category: category.nome,
    subcategory: subcategory.name,
    date: today.toISOString(),
    paid: true,
    fixed: true,
    reminder: false,
    ignore: false,
    note: `Despesa fixa: ${subcategory.name}`,
    source: "Despesa Fixa",
    wallet: "Carteira",
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  };
  batch.set(transactionRef, transactionData);

  // Atualiza saldo
  const novoSaldo = saldoAtual - subcategory.limit;
  batch.update(userRef, {
    saldo: novoSaldo,
    updatedAt: today.toISOString(),
  });

  // Atualiza última execução
  const logRef = db
    .collection("fixed_expenses_log")
    .doc(`${userId}_${category.id}_${subcategory.name}`);
  batch.set(logRef, {
    lastExecution: today.toISOString(),
    updatedAt: today.toISOString(),
  });

  await batch.commit();
}

// Função auxiliar para verificar se deve processar a despesa
async function shouldProcessFixedExpense(
  subcategory: any,
  category: any,
  today: Date,
  userId: string
): Promise<boolean> {
  if (!subcategory.limit || subcategory.limit <= 0) return false;

  // Busca última execução
  const lastExecDoc = await db
    .collection("fixed_expenses_log")
    .doc(`${userId}_${category.id}_${subcategory.name}`)
    .get();

  const lastExecution = lastExecDoc.exists
    ? new Date(lastExecDoc.data()?.lastExecution)
    : null;

  // Verifica frequência
  return checkFrequency(category.frequencia, today, lastExecution);
}

// Função para verificar frequência
function checkFrequency(
  frequency: string,
  today: Date,
  lastExecution: Date | null
): boolean {
  if (!lastExecution) return true;

  const diffTime = Math.abs(today.getTime() - lastExecution.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case "diario":
      return diffDays >= 1;
    case "semanal":
      return diffDays >= 7;
    case "quinzenal":
      return diffDays >= 15;
    case "mensal":
      return today.getDate() === 1 && diffDays >= 28;
    case "trimestral":
      return (
        today.getDate() === 1 && today.getMonth() % 3 === 0 && diffDays >= 89
      );
    case "semestral":
      return (
        today.getDate() === 1 &&
        (today.getMonth() === 0 || today.getMonth() === 6) &&
        diffDays >= 180
      );
    case "anual":
      return today.getDate() === 1 && today.getMonth() === 0 && diffDays >= 365;
    default:
      return false;
  }
}

// Função para atualizar última execução
async function updateLastExecution(
  userId: string,
  categoryId: string,
  subcategoryName: string,
  date: Date
) {
  await db
    .collection("fixed_expenses_log")
    .doc(`${userId}_${categoryId}_${subcategoryName}`)
    .set({
      lastExecution: date.toISOString(),
      updatedAt: new Date().toISOString(),
    });
}
