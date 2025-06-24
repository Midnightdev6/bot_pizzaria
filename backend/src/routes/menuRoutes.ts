import { Router } from "express";
import { menuController } from "../controllers/menuController";

const router = Router();

// GET /api/menu - Buscar cardápio completo
router.get("/", menuController.getFullMenu);

// GET /api/menu/pizzas - Buscar apenas pizzas
router.get("/pizzas", menuController.getPizzas);

// GET /api/menu/drinks - Buscar apenas bebidas
router.get("/drinks", menuController.getDrinks);

// GET /api/menu/desserts - Buscar apenas sobremesas
router.get("/desserts", menuController.getDesserts);

export { router as menuRoutes };
