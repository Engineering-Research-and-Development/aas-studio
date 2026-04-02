import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useSessionContext } from '@/context/SessionContext';
import { config } from '@/utils/config';

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];
let latestAccessToken = "";

export const useApiManager = () => {
  const { operator, setOperator } = useSessionContext();

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || config.apiUrl,
  });

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = latestAccessToken || operator.auth_token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshToken = latestAccessToken || operator.auth_token;
            const refreshResponse = await axios.get(
              `${(import.meta.env.VITE_API_URL || config.apiUrl) + '/v1/auth/refresh'}`,
              { headers: { Authorization: `Bearer ${refreshToken}` } }
            );
            const new_auth_token = refreshResponse.data.data.auth_token;
            latestAccessToken = new_auth_token;

            setOperator({ ...operator, auth_token: new_auth_token });

            failedQueue.forEach((cb) => cb(new_auth_token));
            failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${new_auth_token}`;
            return api(originalRequest);
          } catch (refreshError: any) {
            if (refreshError.response?.status === 403) {
              setOperator(null);
              latestAccessToken = "";
              failedQueue = [];
              return Promise.reject(refreshError);
            }
            failedQueue = [];
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return new Promise((resolve, _reject) => {
          failedQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      return Promise.reject(error);
    }
  );

  return api;
};
