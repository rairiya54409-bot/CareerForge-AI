import api from './api';

export async function analyzeResume(data) {
  const response = await api.post(
    '/api/analysis/resume',
    data
  );

  return response.data;
}

export async function getResumeAnalysis(analysisId) {
  const response = await api.get(
    `/api/analysis/resume/${analysisId}`
  );

  return response.data;
}