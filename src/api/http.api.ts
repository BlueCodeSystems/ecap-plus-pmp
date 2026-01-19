import axios, { AxiosError } from 'axios';
import { ApiError } from '@/api/ApiError';
import { readToken } from '@/services/localStorage.service';

export const httpApi = axios.create({
  baseURL: "/api/dqa",
});

httpApi.interceptors.request.use((config) => {
  const token = readToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpApi.interceptors.response.use(undefined, (error: AxiosError) => {
  const errorData = error.response?.data as ApiErrorData | undefined;
  throw new ApiError<ApiErrorData>(errorData?.message || error.message, errorData);
});

export interface ApiErrorData {
  message: string;
}
