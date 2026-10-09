import api from './api';

export async function startTestSession(testData) {
  const response = await api.post('/api/tests/start', testData);
  return response.data;
}

export async function startInterviewTest(testData) {
  const response = await api.post('/api/tests/interview/start', testData);
  return response.data;
}

export async function submitInterviewAnswer(answerData) {
  const response = await api.post('/api/tests/interview/answer', answerData);
  return response.data;
}

export async function completeInterviewTest(sessionId) {
  const response = await api.patch(`/api/tests/${sessionId}/status`, {
    status: 'completed',
  });

  return response.data;
}