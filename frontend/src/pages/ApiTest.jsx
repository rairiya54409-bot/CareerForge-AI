import { useEffect, useState } from 'react';
import api from '../services/api';

function ApiTest() {
  const [status, setStatus] = useState('Checking backend...');

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await api.get('/api/database-status');

        if (response.status === 200) {
          setStatus('Backend connected successfully');
        }
      } catch (error) {
        console.error(error);
        setStatus('Backend connection failed');
      }
    }

    checkBackend();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h2>{status}</h2>
    </div>
  );
}

export default ApiTest;