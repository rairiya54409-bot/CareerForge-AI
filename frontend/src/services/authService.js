import api from './api';

export async function registerUser(userData) {
  const response = await api.post(
    '/api/auth/register',
    userData
  );

  return response.data;
}

export async function loginUser(credentials) {
  const response = await api.post(
    '/api/auth/login',
    credentials
  );

  return response.data;
}