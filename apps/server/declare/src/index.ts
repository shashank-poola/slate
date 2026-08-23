import express from "express";
import cors from "cors";
import { env } from "./config/env.config";
import routes from "./routes";

const app = express();
const PORT = env.PORT;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Declare server running on port ${PORT}`);
});
