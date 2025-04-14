// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

/* eslint-disable react/prop-types */
import { React, createContext, useEffect, useState } from 'react';

export const AppContext = createContext(null);

export default function AppContextProvider({ children }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || undefined; // REVIEW: should be null or undefined
  });
  
  const handleUserUpdate = (newUsername) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername)
  }
  
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    handleUserUpdate("Guest")
  };

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
  }, [token]);

  return (
    <AppContext.Provider value={{ token, setToken, logout, username, setUsername, handleUserUpdate}}>
      {children}
    </AppContext.Provider>
  );
}