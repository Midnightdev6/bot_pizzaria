import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MenuController {
  async getFullMenu(req: Request, res: Response) {
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: { available: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      return res.json(menuItems);
    } catch (error) {
      console.error("Erro ao buscar menu:", error);
      return res.status(500).json({
        error: "Erro ao buscar menu",
      });
    }
  }

  async getPizzas(req: Request, res: Response) {
    try {
      const pizzas = await prisma.menuItem.findMany({
        where: {
          category: "PIZZA",
          available: true,
        },
        orderBy: { name: "asc" },
      });

      return res.json(pizzas);
    } catch (error) {
      console.error("Erro ao buscar pizzas:", error);
      return res.status(500).json({
        error: "Erro ao buscar pizzas",
      });
    }
  }

  async getDrinks(req: Request, res: Response) {
    try {
      const drinks = await prisma.menuItem.findMany({
        where: {
          category: "BEBIDA",
          available: true,
        },
        orderBy: { name: "asc" },
      });

      return res.json(drinks);
    } catch (error) {
      console.error("Erro ao buscar bebidas:", error);
      return res.status(500).json({
        error: "Erro ao buscar bebidas",
      });
    }
  }

  async getDesserts(req: Request, res: Response) {
    try {
      const desserts = await prisma.menuItem.findMany({
        where: {
          category: "SOBREMESA",
          available: true,
        },
        orderBy: { name: "asc" },
      });

      return res.json(desserts);
    } catch (error) {
      console.error("Erro ao buscar sobremesas:", error);
      return res.status(500).json({
        error: "Erro ao buscar sobremesas",
      });
    }
  }
}

export const menuController = new MenuController();
