// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

// import './App.css'; // TODO: Create Login.css
import { Link } from 'react-router-dom';

function Login() {
  const loginWithGoogle = async () => {
    window.location.href = "http://localhost:8000/auth/google"; 
  };

  return (
    <>
      <h1>Welcome to Citrifi</h1>
      <Link to='/home'>Home</Link>
      <br />

      <button onClick={loginWithGoogle} className='mt-4'>
        Login with google
      </button>
    </>
  );
}

export default Login;