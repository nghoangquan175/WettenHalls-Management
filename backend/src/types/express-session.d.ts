import 'express-session';
import { UserRole } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      permissions: string[];
    };
  }
}
