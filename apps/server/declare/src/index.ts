import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { env } from "./config/env.config";
import { errorHandler } from "./middleware/error-handler.middleware";
import routes from "./routes";

const app = express();
const PORT = env.PORT;

app.use(express.json({ limit: "32mb" }));

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    service: "declare",
  });
});

app.use("/api", routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Declare server running on port ${PORT}`);
});
