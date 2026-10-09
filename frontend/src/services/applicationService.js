import api from './api';

export async function getApplications() {
  const response = await api.get('/api/applications');
  return response.data;
}

export async function createApplication(applicationData) {
  const response = await api.post(
    '/api/applications',
    applicationData
  );

  return response.data;
}

export async function getApplication(applicationId) {
  const response = await api.get(
    `/api/applications/${applicationId}`
  );

  return response.data;
}

export async function deleteApplication(applicationId) {
  const response = await api.delete(
    `/api/applications/${applicationId}`
  );

  return response.data;
}

export async function updateApplicationStatus(
  applicationId,
  status
) {
  const response = await api.patch(
    `/api/applications/${applicationId}/status`,
    {
      status,
    }
  );

  return response.data;
}