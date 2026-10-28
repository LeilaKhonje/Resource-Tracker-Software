
export enum UserRole {
  TEAM_LEAD = 'TEAM_LEAD',
  LINE_MANAGER = 'LINE_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  MANAGING_DIRECTOR = 'MANAGING_DIRECTOR',
}


export interface AuthUser {
  id: string;
  role: UserRole;
}