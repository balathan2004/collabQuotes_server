import "express";

declare global {
  namespace Express {
    interface Request {
      jwt?: any; // or better: { id: string; email: string } etc.
    }
  }
}
