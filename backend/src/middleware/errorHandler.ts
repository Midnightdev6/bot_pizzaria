import { Request, Response } from "express";

/**
 * Middleware para rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    error: "Rota não encontrada",
    path: req.originalUrl,
  });
}
