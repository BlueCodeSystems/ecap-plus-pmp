import axios from 'axios';
import { UserModel } from '@app/domain/UserModel';

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
    user: {
      id: number;
      firstName: string;
      lastName: string;
      imgUrl: string;
      userName: string;
      email: {
        name: string;
        verified: boolean;
      };
      phone: {
        number: string;
        verified: boolean;
      };
      sex: 'male' | 'female';
      birthday: string;
      lang: 'en' | 'de';
      country: string;
      city: string;
      address1: string;
      address2?: string;
      zipcode: number;
      website?: string;
      socials?: {
        twitter?: string;
        facebook?: string;
        linkedin?: string;
      };
    };
  };
}


export const login = async (loginPayload: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${process.env.REACT_APP_BASE_URL}/auth/login`,
    loginPayload
  );
  return response.data;
};

export const signUp = (signUpData: SignUpRequest): Promise<void> => 
  axios.post<void>(`${process.env.REACT_APP_BASE_URL}/users`, signUpData).then(({ data }) => data);

export const resetPassword = (resetPasswordPayload: ResetPasswordRequest): Promise<void> => 
  axios.post<void>(`${process.env.REACT_APP_BASE_URL}/auth/password/request`, resetPasswordPayload).then(({ data }) => data);

export const verifySecurityCode = (securityCodePayload: SecurityCodePayload): Promise<void> => 
  axios.post<void>(`${process.env.REACT_APP_BASE_URL}/auth/verify`, securityCodePayload).then(({ data }) => data);

export const setNewPassword = (newPasswordData: NewPasswordData): Promise<void> => 
  axios.post<void>(`${process.env.REACT_APP_BASE_URL}/auth/password/reset`, newPasswordData).then(({ data }) => data);
