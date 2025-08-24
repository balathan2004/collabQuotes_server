import { Request,Response } from "express";
import jwt from "jsonwebtoken";
import { JwtRequest } from "./interfaces";

export function verifyToken(token:string,req:JwtRequest,res:Response,next:any){
 jwt.verify(token, process.env.JWT_SECRET || "", (err, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Auth Token Not found",
      });
    } else {
      req.jwt=user as any;
    
      next();
    }

    // userId and username from JWT payload
    return;
  });
}