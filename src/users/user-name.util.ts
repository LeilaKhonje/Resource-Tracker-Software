import { User } from './user.entity';

type UserNameSource = Pick<User, 'fullName' | 'firstName' | 'middleName' | 'surname'>;

export function userNameFields(user: UserNameSource) {
  const legacyParts = (user.fullName ?? '').trim().split(/\s+/).filter(Boolean);
  const legacyFirstName = legacyParts[0] ?? '';
  const legacySurname = legacyParts.length > 1 ? legacyParts[legacyParts.length - 1] : '';
  const legacyMiddleName = legacyParts.length > 2
    ? legacyParts.slice(1, -1).join(' ')
    : '';
  const firstName = user.firstName?.trim() || legacyFirstName;
  const middleName = user.middleName?.trim() || legacyMiddleName;
  const surname = user.surname?.trim() || legacySurname;

  return {
    firstName,
    ...(middleName ? { middleName } : {}),
    surname,
  };
}

export function userNameResponse<T extends User>(user: T) {
  const response = { ...user } as Record<string, unknown>;
  delete response.fullName;
  return { ...response, ...userNameFields(user) };
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? '';
  const surname = parts.length > 0 ? parts.pop()! : '';
  const middleName = parts.join(' ') || null;
  return { firstName, middleName, surname };
}
