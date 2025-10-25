import { Request, Response, NextFunction } from "express";
import { db } from "../services/firebase/firebase.service";
import { ApiError } from "../utils/apiError";
import { FieldValue } from "firebase-admin/firestore";

export const ensureUserDocumentExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.uid) {
      return next(new ApiError(401, "Não autenticado"));
    }

    const userRef = db.collection("usuarios").doc(req.user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Cria documento básico se não existir
      await userRef.set(
        {
          name: req.user.name || "Novo Usuário", // Valor padrão se name não existir
          email: req.user.email || "",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
