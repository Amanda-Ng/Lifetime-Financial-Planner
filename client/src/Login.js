// export default Login;

// // TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

import { React } from "react-router-dom";
import "./Login.css";

function Login() {
    const loginWithGoogle = async () => {
        window.location.href = "http://localhost:8000/auth/google";
    };

    return (
        <div className="welcome_page">
            <h1 className="welcome_message">Welcome to Citrifi</h1>
            <button onClick={loginWithGoogle} className="google_login_button">
                <img src="google_icon.png" alt="Google Icon" className="google_icon" />
                Continue with Google
            </button>
        </div>
    );
}

export default Login;
