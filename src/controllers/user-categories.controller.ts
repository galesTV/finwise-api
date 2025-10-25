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
