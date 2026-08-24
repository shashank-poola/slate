import type { NextFunction, Request, Response } from "express";

export const errorHandler = (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "The uploaded manuscript is too large. Please use a file smaller than 20 MB.",
      error: "PAYLOAD_TOO_LARGE",
    });
  }

  return next(err);
};
