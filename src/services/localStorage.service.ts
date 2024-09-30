import { UserModel } from '@app/domain/UserModel';

export const persistToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const readToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const persistUser = (user: UserModel): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const readUser = (): UserModel | null => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const deleteToken = (): void => {
  localStorage.removeItem('access_token');
};

export const deleteUser = (): void => {
  localStorage.removeItem('user');
};