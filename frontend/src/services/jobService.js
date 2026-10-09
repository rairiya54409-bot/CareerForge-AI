import api from './api';

export async function getRecommendedJobs(analysisId) {
  const response = await api.post(
    `/api/jobs/recommend/${analysisId}`
  );

  return response.data;
}