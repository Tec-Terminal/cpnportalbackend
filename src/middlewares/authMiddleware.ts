import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel';
import Manager from '../models/managersModel'; // Assuming the Manager model file name
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || '';

const verifyToken = async (req: any, res: any, next: any) => {
    try {
      const token =
        req.body.token || req.query.token || req.headers["x-access-token"];
    
      if (!token) {
        return res.status(400).json({ data: [], status: 400, msg: "A token is required for authentication" });
      }
      
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if(decoded.id){
        let isAdmin = true;
        let user = await Admin.findById(decoded.id);
      if(!user){
        user = await Manager.findById(decoded.id);
        isAdmin = false;
      }
      if(!user){
        return res.status(400).json({  status: 400, data: "Invalid token" });
      }
      if(isAdmin){
        req.admin = user;
        next();
      }else{
        req.manager = user;
        next();
      }
        
  
       
      }else{
        return res.status(400).json({ data: [], status: 400, msg: "error while authenticating" });
      }
    } catch (err) {
      return res.status(500).json({ data: [], status: 400, msg: "Invalid auth token" });
    }
      
    };
    
  export default verifyToken;