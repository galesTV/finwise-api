import { NextFunction, Request, Response } from "express";
import { db, auth, FieldValue } from "../services/firebase/firebase.service";
import { ApiError } from "../utils/apiError";

export const UserController = {
  // Obtém perfil do usuário
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const userDoc = await db.collection("usuarios").doc(req.user.uid).get();

      if (!userDoc.exists) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      const userData = userDoc.data();

      res.json({
        success: true,
        user: {
          uid: req.user.uid,
          email: userData?.email,
          name: userData?.name,
          phone: userData?.phone,
          createdAt: userData?.createdAt?.toDate(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Atualiza perfil do usuário
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const { name, phone } = req.body;

      await db
        .collection("usuarios")
        .doc(req.user.uid)
        .update({
          ...(name && { name }),
          ...(phone && { phone }),
          updatedAt: new Date(),
        });

      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCompleteProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const {
        fullName,
        nickname,
        birthDate,
        gender,
        postalCode,
        city,
        state,
        financialGoal,
      } = req.body;

      // Converter a data de nascimento para o formato Firestore
      let formattedBirthDate = null;
      if (birthDate) {
        const [day, month, year] = birthDate.split("/");
        // Usar meio-dia para evitar problemas de fuso
        formattedBirthDate = new Date(`${year}-${month}-${day}T12:00:00`);
      }

      const updateData = {
        name: fullName,
        nickname: nickname || null,
        birthDate: formattedBirthDate,
        gender: gender || null,
        postalCode: postalCode || null,
        city: city || null,
        state: state || null,
        financialGoal: financialGoal || null,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await db.collection("usuarios").doc(req.user.uid).update(updateData);

      res.json({
        success: true,
        message: "Perfil atualizado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  },

  async getCompleteProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const userDoc = await db.collection("usuarios").doc(req.user.uid).get();

      if (!userDoc.exists) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      const userData = userDoc.data();

      // Formata a data de nascimento para exibição
      let formattedBirthDate = "";
      if (userData?.birthDate) {
        const date = userData.birthDate.toDate();
        formattedBirthDate = `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      }

      res.json({
        success: true,
        profile: {
          fullName: userData?.name || "",
          nickname: userData?.nickname || "",
          birthDate: formattedBirthDate,
          email: userData?.email || "",
          phone: userData?.phone || "",
          gender: userData?.gender || "",
          postalCode: userData?.postalCode || "",
          city: userData?.city || "",
          state: userData?.state || "",
          financialGoal: userData?.financialGoal || "",
          createdAt: userData?.createdAt?.toDate(),
          updatedAt: userData?.updatedAt?.toDate(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async validateCompleteProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { fullName, birthDate, postalCode } = req.body;

    if (!fullName?.trim()) {
      return next(new ApiError(400, "Nome completo é obrigatório"));
    }

    if (birthDate && !/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
      return next(
        new ApiError(400, "Formato de data inválido. Use DD/MM/AAAA")
      );
    }

    if (postalCode && !/^\d{8}$/.test(postalCode.replace(/\D/g, ""))) {
      return next(new ApiError(400, "CEP inválido. Deve conter 8 dígitos"));
    }

    next();
  },

  // Atualizar saldo do usuário
  async updateSaldo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const { saldo } = req.body;

      if (saldo === undefined || saldo === null) {
        throw new ApiError(400, "Saldo é obrigatório");
      }

      if (typeof saldo !== "number") {
        throw new ApiError(400, "Saldo deve ser um número");
      }

      if (saldo < 0) {
        throw new ApiError(400, "Saldo não pode ser negativo");
      }

      // Limitar o saldo a um valor máximo (opcional)
      if (saldo > 1000000) {
        throw new ApiError(400, "Saldo máximo permitido é R$ 1.000.000,00");
      }

      await db.collection("usuarios").doc(req.user.uid).update({
        saldo,
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Saldo atualizado com sucesso",
        saldo,
      });
    } catch (error) {
      next(error);
    }
  },

  // Obter saldo do usuário
  async getSaldo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      const userDoc = await db.collection("usuarios").doc(req.user.uid).get();

      if (!userDoc.exists) {
        throw new ApiError(404, "Usuário não encontrado");
      }

      const userData = userDoc.data();
      const saldo = userData?.saldo || 0;

      res.json({
        success: true,
        saldo,
      });
    } catch (error) {
      next(error);
    }
  },

  // Deletar conta
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.uid) {
        throw new ApiError(401, "Não autenticado");
      }

      // 1. Deletar do Firestore
      await db.collection("usuarios").doc(req.user.uid).delete();

      // 2. Deletar do Firebase Auth
      await auth.deleteUser(req.user.uid);

      res.json({
        success: true,
        message: "Conta deletada com sucesso",
      });
    } catch (error) {
      next(error);
    }
  },
};
