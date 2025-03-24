// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

/* eslint-disable react/prop-types */
import { Suspense } from 'react';
import useApp from './hooks/useApp';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { token } = useApp();

  return (
    <Suspense fallback={<p>Loading...</p>}>
      {token ? children : <Navigate to={'/login'} />}
    </Suspense>
  );
};

export default PrivateRoute;