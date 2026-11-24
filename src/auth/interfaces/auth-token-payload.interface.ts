import { UserRole } from '../../users/user-role.enum';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole | null;
  /** Snapshot included in newly issued access tokens; account state remains authoritative. */
  mustChangePassword?: boolean;
  iat?: number;
  tokenVersion?: number;
}
