import api from './api';

export async function getLearningRoadmap(analysis) {
  const response = await api.post(
    '/api/roadmap/generate',
    {
      missing_skills: analysis?.missing_skills || [],
      recommended_roles: analysis?.recommended_roles || [],
      career_interests: analysis?.career_interests || [],
    }
  );

  return response.data;
}