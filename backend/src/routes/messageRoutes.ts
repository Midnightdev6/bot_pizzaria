import { Router } from "express";
import { messageController } from "../controllers/messageController";

const router = Router();

// POST /api/messages - Enviar mensagem para IA
router.post("/", messageController.sendMessage);

// GET /api/messages - Buscar histórico de mensagens
router.get("/", messageController.getMessages);

export { router as messageRoutes };
