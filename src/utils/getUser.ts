import { request } from "http";
import Admin, { IAdmin } from "../models/adminModel";
import Manager, { IManagers } from "../models/managersModel";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';

export type AuthUser = {
    isAdmin: true;
    user: IAdmin
} | {
    isAdmin: false;
    user: IManagers
}

export async function getUser(req: any): Promise <AuthUser | null>{
    const token = req.headers['x-access-token'];
    let isAdmin = true;
    if (!token) {
        return null;
      }
      
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if(!decoded.id){
        return null;
      }
      let user = await Admin.findById(decoded.id);
      if(!user){
        user = await Manager.findById(decoded.id);
        isAdmin = false;
      }
      if(!user){
        return null;
      }
      return {
        isAdmin,  
        user
      } as AuthUser
}
