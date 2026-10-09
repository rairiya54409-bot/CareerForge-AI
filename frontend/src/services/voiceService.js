import api from './api';

export async function voiceAssistant(audioBlob) {
  const formData = new FormData();

  formData.append(
    'file',
    audioBlob,
    'voice-input.webm'
  );

  const response = await api.post(
    '/api/voice/assistant',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export function getAudioUrl(audioUrl) {
  if (!audioUrl) return null;

  if (audioUrl.startsWith('http')) {
    return audioUrl;
  }

  return `http://127.0.0.1:8000${audioUrl}`;
}