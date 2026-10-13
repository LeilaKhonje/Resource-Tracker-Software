import { UserRole } from '../../users/user-role.enum';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole | null;
}
