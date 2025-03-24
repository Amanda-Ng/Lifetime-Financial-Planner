// TP: Copilot suggested this code for a new file for the prompt "What happens after auth and I get a /success route?":

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useApp from './hooks/useApp'; // Custom hook to access AppContext

function Success() {
  const navigate = useNavigate();
  const { setToken } = useApp(); // Access the setToken function from AppContext

  useEffect(() => {
    
    // Extract the token from the URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    console.log('token:', token);
    if (token) {
      // Store the token in the AppContext and localStorage
      setToken(token);
      localStorage.setItem('token', token);

      // Redirect to the protected home page
      navigate('/home');
    } else {
      // If no token is found, redirect to the login page
      navigate('/login');
    }
  }, [navigate, setToken]);

  return <p>Processing login...</p>;
};

export default React.memo(Success);