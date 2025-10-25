import { Request, Response, NextFunction } from "express";
import { db } from "../services/firebase/firebase.service";
import { ApiError } from "../utils/apiError";

interface Reminder {
  title: string;
  description?: string;
  dueDate: string;
  priority?: "low" | "medium" | "high";
  userId: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
  category?: string;
}

export const createReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verifica autenticação
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { title, dueDate, description, priority, category } = req.body;

    // Validações obrigatórias
    if (!title || !dueDate) {
      throw new ApiError(400, "Título e data de vencimento são obrigatórios");
    }

    // Valida formato da data (pode ser aprimorado)
    if (isNaN(Date.parse(dueDate))) {
      throw new ApiError(400, "Formato de data inválido");
    }

    // Valida apenas data futuras
    if (new Date(dueDate) < new Date()) {
      throw new ApiError(400, "Data de vencimento deve ser futura");
    }

    // Valida prioridade se fornecida
    if (priority && !["low", "medium", "high"].includes(priority)) {
      throw new ApiError(400, "Prioridade deve ser low, medium ou high");
    }

    // Verifica se já existe lembrete com mesmo título para o usuário
    const existingReminder = await db
      .collection("reminders")
      .where("userId", "==", req.user.uid)
      .where("title", "==", title)
      .limit(1)
      .get();

    if (!existingReminder.empty) {
      throw new ApiError(409, "Já existe um lembrete com este título");
    }

    // Cria objeto do lembrete
    const reminderData: Reminder = {
      title,
      dueDate: new Date(dueDate).toISOString(),
      userId: req.user.uid,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      ...(description && { description }),
      ...(priority && { priority }),
      ...(category && { category }),
    };

    // Adiciona ao Firestore
    const docRef = await db.collection("reminders").add(reminderData);
    const newReminder = await docRef.get();

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newReminder.data(),
      },
    });
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);

    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(500, "Erro ao criar lembrete"));
    }
  }
};

export const getReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { completed, priority, limit } = req.query;

    let query = db
      .collection("reminders")
      .where("userId", "==", req.user.uid)
      .orderBy("dueDate", "asc");

    if (completed === "true" || completed === "false") {
      query = query.where("isCompleted", "==", completed === "true");
    }

    if (priority && ["low", "medium", "high"].includes(priority as string)) {
      query = query.where("priority", "==", priority);
    }

    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit));
    }

    const snapshot = await query.get();

    const reminders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    console.error("Erro ao buscar lembretes:", error);
    next(new ApiError(500, "Erro ao buscar lembretes"));
  }
};

export const getReminderById = async (
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
      throw new ApiError(400, "ID do lembrete não fornecido");
    }

    const doc = await db.collection("reminders").doc(id).get();

    if (!doc.exists) {
      throw new ApiError(404, "Lembrete não encontrado");
    }

    const reminder = doc.data();

    // Verifica se o lembrete pertence ao usuário
    if (reminder?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...reminder,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar lembrete:", error);
    next(new ApiError(500, "Erro ao buscar lembrete"));
  }
};

export const updateReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificação de autenticação
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { id } = req.params;

    // Validação do ID
    if (!id) {
      throw new ApiError(400, "ID do lembrete não fornecido");
    }

    // Validação do corpo da requisição
    if (req.headers["content-type"] !== "application/json") {
      throw new ApiError(400, "Content-Type deve ser application/json");
    }

    const { title, dueDate, description, priority, isCompleted, category } =
      req.body;

    // Validações dos campos
    if (dueDate && isNaN(Date.parse(dueDate))) {
      throw new ApiError(400, "Formato de data inválido");
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      throw new ApiError(400, "Prioridade deve ser low, medium ou high");
    }

    if (
      typeof isCompleted !== "undefined" &&
      typeof isCompleted !== "boolean"
    ) {
      throw new ApiError(400, "isCompleted deve ser booleano");
    }

    const reminderRef = db.collection("reminders").doc(id);
    const doc = await reminderRef.get();

    // Verifica existência do lembrete
    if (!doc.exists) {
      throw new ApiError(404, "Lembrete não encontrado");
    }

    // Verifica se o lembrete pertence ao usuário
    if (doc.data()?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    // Campos permitidos para atualização
    const allowedFields = [
      "title",
      "dueDate",
      "description",
      "priority",
      "isCompleted",
      "category",
    ];
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // Filtra apenas campos permitidos e válidos
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];

        // Formata a data se for o campo dueDate
        if (field === "dueDate" && req.body[field]) {
          updateData[field] = new Date(req.body[field]).toISOString();
        }
      }
    });

    // Verifica se há campos para atualizar
    if (Object.keys(updateData).length <= 1) {
      // Apenas updatedAt
      throw new ApiError(400, "Nenhum campo válido fornecido para atualização");
    }

    // Atualiza no Firestore
    await reminderRef.update(updateData);
    const updatedDoc = await reminderRef.get();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error);

    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof Error) {
      next(new ApiError(500, error.message));
    } else {
      next(new ApiError(500, "Erro ao atualizar lembrete"));
    }
  }
};

export const deleteReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificação de autenticação
    if (!req.user?.uid) {
      throw new ApiError(401, "Usuário não autenticado");
    }

    const { id } = req.params;

    // Validação do ID
    if (!id) {
      throw new ApiError(400, "ID do lembrete não fornecido");
    }

    const reminderRef = db.collection("reminders").doc(id);
    const doc = await reminderRef.get();

    // Verifica existência do lembrete
    if (!doc.exists) {
      throw new ApiError(404, "Lembrete não encontrado");
    }

    // Verifica se o lembrete pertence ao usuário
    if (doc.data()?.userId !== req.user.uid) {
      throw new ApiError(403, "Acesso não autorizado");
    }

    // Remove o lembrete
    await reminderRef.delete();

    // Resposta 204 No Content para DELETE bem-sucedido
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar lembrete:", error);

    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof Error) {
      next(new ApiError(500, error.message));
    } else {
      next(new ApiError(500, "Erro ao deletar lembrete"));
    }
  }
};

// Exportação para as rotas
export const ReminderController = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
};
