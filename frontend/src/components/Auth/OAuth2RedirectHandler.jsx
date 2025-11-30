import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { setUser, setAdmin } from "../../store/slices/authSlice";
import api from "../../services/api";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const handleOAuth2Redirect = async () => {
      try {

        const hash = window.location.hash;
        const tokenMatch = hash.match(/token=([^&]+)/);
        
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1];
          console.log('Token from OAuth2 redirect:', token.substring(0, 20) + '...');
          
          const userWithToken = {
            token: token
          };
          localStorage.setItem('user', JSON.stringify(userWithToken));
          
          const response = await api.get('/api/auth/user');
          const userData = response.data;
          
          const fullUserData = {
            ...userData,
            token: token
          };
          
          localStorage.setItem('user', JSON.stringify(fullUserData));
          dispatch(setUser(fullUserData));

          if (userData.roles && userData.roles.includes("ROLE_ADMIN")) {
            dispatch(setAdmin(true));
          } else {
            dispatch(setAdmin(false));
          }
          
          navigate('/dashboard');
        } else {
          // No token in URL, try to fetch user info directly (cookie-based auth)
          console.log('No token in URL, attempting cookie-based auth...');
          const response = await api.get('/api/auth/user');
          const userData = response.data;
          
          const userWithToken = {
            ...userData,
            token: 'oauth2-cookie'
          };

          localStorage.setItem('user', JSON.stringify(userWithToken));
          dispatch(setUser(userWithToken));

          if (userData.roles && userData.roles.includes("ROLE_ADMIN")) {
            dispatch(setAdmin(true));
          } else {
            dispatch(setAdmin(false));
          }
          
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('OAuth2 redirect error:', error.response?.data || error.message);
        setError('Authentication failed. Please try again.');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleOAuth2Redirect();
  }, [navigate, dispatch, isAuthenticated]);

  if (loading) {
    return <div>Completing authentication...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Redirecting...</div>;
};

export default OAuth2RedirectHandler;