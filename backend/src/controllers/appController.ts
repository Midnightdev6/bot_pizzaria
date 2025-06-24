import { Request, Response } from "express";

export class AppController {
  /**
   * GET / - Informações da API
   */
  getApiInfo(req: Request, res: Response) {
    return res.json({
      message: "🍕 AI Agent Pizzaria Backend",
      version: "1.0.0",
      status: "Online",
      aiProvider: "Google Gemini AI",
      endpoints: {
        messages: "/api/messages",
        menu: "/api/menu",
        health: "/health",
      },
    });
  }

  /**
   * GET /health - Status do servidor
   */
  getHealthCheck(req: Request, res: Response) {
    return res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "Connected",
      ai: "Gemini AI Ready",
    });
  }
}

export const appController = new AppController();
