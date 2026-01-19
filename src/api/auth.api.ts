import { httpApi } from '@/api/http.api';
import { UserModel } from '@/types/user.types';

export interface AuthData {
  email: string;
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface SecurityCodePayload {
  code: string;
}

export interface NewPasswordData {
  newPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    access_token: string;
    expires: number;
    first_name: string;
    last_name: string;
    location: string;
    refresh_token: string;
    user: UserModel;
  };
}

export const login = async (loginPayload: LoginRequest): Promise<LoginResponse> => {
  const response = await httpApi.post<LoginResponse>('/auth/login', loginPayload);
  return response.data;
};

export const signUp = async (signUpData: SignUpRequest): Promise<void> => {
  await httpApi.post<void>('/users', signUpData);
};

export const resetPassword = async (resetPasswordPayload: ResetPasswordRequest): Promise<void> => {
  await httpApi.post<void>('/auth/password/request', resetPasswordPayload);
};

export const verifySecurityCode = async (securityCodePayload: SecurityCodePayload): Promise<void> => {
  await httpApi.post<void>('/auth/verify', securityCodePayload);
};

export const setNewPassword = async (newPasswordData: NewPasswordData): Promise<void> => {
  await httpApi.post<void>('/auth/password/reset', newPasswordData);
};
