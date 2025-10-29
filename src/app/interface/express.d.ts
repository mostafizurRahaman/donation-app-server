import { IAuth } from '../modules/Auth/auth.interface';

declare global {
  namespace Express {
    interface Request {
      user: IAuth;
    }
  }
}
