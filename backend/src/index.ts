import express from "express";
import { serverConfig, logServerInfo } from "./config/server";
import { corsMiddleware } from "./middleware/corsMiddleware";
import { notFoundHandler } from "./middleware/errorHandler";
import { appController } from "./controllers/appController";
import { apiRoutes } from "./routes";

const app = express();

// Middlewares
app.use(corsMiddleware);
app.use(express.json());

// Rotas básicas
app.get("/", appController.getApiInfo);
app.get("/health", appController.getHealthCheck);

// Rotas da API
app.use("/api", apiRoutes);

// Middleware para rotas não encontradas
app.use("*", notFoundHandler);

// Iniciar servidor
app.listen(serverConfig.port, () => {
  logServerInfo(serverConfig.port);
});

export default app;
