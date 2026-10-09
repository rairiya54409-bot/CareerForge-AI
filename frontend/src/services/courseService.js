import api from './api';

export async function getRecommendedCourses(analysis) {
  const response = await api.post('/api/courses/recommend', {
    missing_skills: analysis?.missing_skills || [],
    recommended_roles: analysis?.recommended_roles || [],
    career_interests: analysis?.career_interests || [],
  });

  return response.data;
}