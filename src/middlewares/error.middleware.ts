import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/apiError";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("[ERROR]", err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  if (
    "code" in err &&
    typeof err.code === "string" &&
    err.code.startsWith("auth/")
  ) {
    res.status(401).json({
      error: "Falha na autenticação",
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { message: err.message }),
    });
    return;
  }

  res.status(500).json({
    error: "Erro interno no servidor",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
    }),
  });
};
