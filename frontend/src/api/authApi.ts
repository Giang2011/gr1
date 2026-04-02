import axiosClient from './axiosClient';

export const authApi = {
  login: (data: any) => {
    return axiosClient.post('/v1/auth/login', data);
  },
  register: (data: any) => {
    return axiosClient.post('/v1/auth/register', data);
  }
};
