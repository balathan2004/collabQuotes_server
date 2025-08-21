import { Response } from "express";
import jwt from "jsonwebtoken";

export function verifyToken(token:string,res:Response,next:any){
 jwt.verify(token, process.env.JWT_SECRET || "", (err, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Auth Token Not found",
      });
    } else {
      return user
      next();
    }

    // userId and username from JWT payload
    return;
  });
}


