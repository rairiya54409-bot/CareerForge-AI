import api from './api';

export async function getDashboardData() {
  const response = await api.get('/api/analytics/applications');
  return response.data;
}

export async function getDashboardSkillProgress() {
  const response = await api.get('/api/skill-progress');
  return response.data;
}