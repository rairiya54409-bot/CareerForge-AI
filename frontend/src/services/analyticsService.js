import api from './api';

export async function getApplicationAnalytics() {
  const response = await api.get('/api/analytics/applications');
  return response.data;
}