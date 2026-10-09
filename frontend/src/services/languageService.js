import api from './api';

export async function getLanguage() {
  const response = await api.get('/api/language');
  return response.data;
}

export async function updateLanguage(language) {
  const response = await api.put('/api/language', {
    language,
  });

  return response.data;
}