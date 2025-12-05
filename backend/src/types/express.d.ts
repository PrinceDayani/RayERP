import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
