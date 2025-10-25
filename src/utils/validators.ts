import { body } from "express-validator";
import { CategoryModel } from "../models/category.model";
import { Categoria } from "../types/categoria";

export const Validators = {
  validateCategory: [
    body("nome").trim().notEmpty().withMessage("Nome é obrigatório"),
    body("tipo").isIn(["entrada", "saída"]).withMessage("Tipo inválido"),
    body("cor").isHexColor().withMessage("Cor inválida"),
    body("imagem").notEmpty().withMessage("Ícone é obrigatório"),

    body("nome").custom(async (name, { req }) => {
      const userId = req.user!.uid;
      const categories = (await CategoryModel.findByUser(
        userId
      )) as Categoria[];

      const exists = categories.some(
        (cat) =>
          cat.nome.toLowerCase() === name.toLowerCase() &&
          cat.tipo === req.body.type
      );

      if (exists) {
        throw new Error("Categoria já existe para este tipo");
      }
      return true;
    }),
  ],

  // ... (outras validações permanecem iguais)
};
