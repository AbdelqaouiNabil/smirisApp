
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const { handleAuthentication } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        await handleAuthentication(accessToken, refreshToken);
        // Redirect to the dashboard or home page after successful login
        navigate('/dashboard'); 
      } else {
        // Handle error case, e.g., redirect to login with an error message
        navigate('/login?error=auth_failed');
      }
    };

    handleAuth();
  }, [location, handleAuthentication, navigate]);

  return (
    <div>
      <p>Loading...</p>
    </div>
  );
};

export default AuthCallback; 