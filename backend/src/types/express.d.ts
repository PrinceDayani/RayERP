import { Request } from 'express';

export interface AuthUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
