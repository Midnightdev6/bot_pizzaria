import { Router } from "express";
import { messageRoutes } from "./messageRoutes";
import { menuRoutes } from "./menuRoutes";

const router = Router();

// Rotas da API
router.use("/messages", messageRoutes);
router.use("/menu", menuRoutes);

export { router as apiRoutes };
