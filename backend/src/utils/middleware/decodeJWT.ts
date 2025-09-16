import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../../types';

const secretKey = 'your_secret_key'; // Replace with your secret key

const decodeJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      
      req.user = decoded as JWTPayload;
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    res.status(401).json({ error: "Token required" });
  }
};

export default decodeJWT;