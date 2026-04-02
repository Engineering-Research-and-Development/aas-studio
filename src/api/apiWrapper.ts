import { useApiManager } from '@/api/apiManger';

interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
  total?: number;
  statusCode: number;
  blob?: () => Promise<Blob>;
}

export const useApiWrapper = () => {
  const api = useApiManager();

  const request = async <T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<ApiResponse<T>> => {
    try {
      const headers = { ...(config?.headers || {}) };
      const responseType = config?.responseType ||
        (config?.accept === 'text/csv' || config?.accept === 'text/html' ? 'blob' : undefined);

      const response = await api.request({ method, url, data, ...config, headers, responseType });

      if (responseType === 'blob' || response.data instanceof Blob) {
        return {
          status: 'Success',
          message: '',
          data: {} as T,
          statusCode: response.status,
          blob: async () => response.data,
        };
      }

      if (url.endsWith('fetch/count')) {
        return {
          status: response.data.status || 'Success',
          message: response.data.message || '',
          data: response.data.data || 0,
          statusCode: response.status,
        };
      }

      return {
        status: response.data.status || 'Success',
        message: response.data.message || '',
        data: response.data.data || null,
        total: response.data.total || 0,
        statusCode: response.status,
        blob: async () => {
          const jsonString = JSON.stringify(response.data);
          return new Blob([jsonString], { type: 'application/json' });
        },
      };
    } catch (error: any) {
      return {
        status: 'Error',
        message: error.response?.data?.message || 'An error occurred',
        data: error.response?.data || {},
        statusCode: error.response?.status || 500,
      };
    }
  };

  return {
    get: <T = any>(url: string, config?: any) => request<T>('get', url, undefined, config),
    post: <T = any>(url: string, data?: any, config?: any) => request<T>('post', url, data, config),
    put: <T = any>(url: string, data?: any, config?: any) => request<T>('put', url, data, config),
    delete: <T = any>(url: string, config?: any) => request<T>('delete', url, undefined, config),

    postFormData: <T = any>(url: string, formData: FormData | { [key: string]: any }, config?: any) => {
      let finalFormData: FormData;
      if (formData instanceof FormData) {
        finalFormData = formData;
      } else {
        finalFormData = new FormData();
        Object.keys(formData).forEach(key => {
          const value = formData[key];
          if (value instanceof Blob || value instanceof File) {
            finalFormData.append(key, value);
          } else if (value !== null && value !== undefined) {
            finalFormData.append(key, String(value));
          }
        });
      }
      return request<T>('post', url, finalFormData, {
        ...config,
        headers: { ...((config?.headers || {}) as Record<string, string>) },
      });
    },

    uploadFile: <T = any>(
      url: string,
      file: Blob | File,
      fieldName: string = 'file',
      additionalData?: { [key: string]: any },
      config?: any
    ) => {
      const formData = new FormData();
      formData.append(fieldName, file);
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          const value = additionalData[key];
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
      }
      return request<T>('post', url, formData, {
        ...config,
        headers: { ...((config?.headers || {}) as Record<string, string>) },
      });
    },
  };
};
