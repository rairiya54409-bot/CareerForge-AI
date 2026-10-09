import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Auth from '../components/Auth/Auth';

function AuthPage() {
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();

  function handleAuthSuccess() {
    navigate('/dashboard', { replace: true });
  }

  return (
    <Auth
      mode={mode}
      onModeChange={setMode}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}

export default AuthPage;