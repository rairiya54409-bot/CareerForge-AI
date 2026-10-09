import api from './api';

export async function startTestSession(testData) {
  const response = await api.post(
    '/api/tests/start',
    testData
  );

  return response.data;
}

export async function startAptitudeTest(testData) {
  const response = await api.post(
    '/api/tests/aptitude/start',
    testData
  );

  return response.data;
}

export async function submitAptitudeAnswer(answerData) {
  const response = await api.post(
    '/api/tests/aptitude/answer',
    answerData
  );

  return response.data;
}