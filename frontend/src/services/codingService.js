import api from './api';

export async function startTestSession(testData) {
  const response = await api.post(
    '/api/tests/start',
    testData
  );

  return response.data;
}

export async function startCodingTest(testData) {
  const response = await api.post(
    '/api/tests/coding/start',
    testData
  );

  return response.data;
}

export async function submitCodingAnswer(answerData) {
  const response = await api.post(
    '/api/tests/coding/submit',
    answerData
  );

  return response.data;
}