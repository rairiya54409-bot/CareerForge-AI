import api from './api';

export async function getSkillProgress() {
  const response = await api.get('/api/skill-progress');
  return response.data;
}

export async function addOrUpdateSkill(skillData) {
  const response = await api.post(
    '/api/skill-progress',
    skillData
  );

  return response.data;
}

export async function updateSkillFromTest(testData) {
  const response = await api.post(
    '/api/skill-progress/from-test',
    testData
  );

  return response.data;
}