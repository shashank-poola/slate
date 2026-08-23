import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { env } from "./config/env.config";
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

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "The uploaded manuscript is too large. Please use a file smaller than 20 MB.",
      error: "PAYLOAD_TOO_LARGE",
    });
  }

  return next(err);
});

app.listen(PORT, () => {
  console.log(`Declare server running on port ${PORT}`);
});
