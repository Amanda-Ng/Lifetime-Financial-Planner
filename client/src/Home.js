// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
// Proof of concept for Google OAuth and using apiClient to make authenticated requests
// isAuthenticated route is protected by JWT token
// apiClient is a wrapper around axios to make authenticated requests

import { useEffect, useState, React } from "react";
import useApp from "./hooks/useApp";
import { axiosClient } from "./services/apiClient";

function Home() {
    const { token, logout } = useApp();
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosClient.get("/isAuthenticated");
                setUser(data.user);
            } catch (err) {
                console.log(err.response);
            }
        })();
    }, [token]);

    return (
        <div className="p-4">
            <h1 className="text-2x1"> {user?.username} </h1>
            <p className="text-zinc-500"> This is a protected page. </p>
            <button onClick={logout} className="mt-4">
                {" "}
                Logout{" "}
            </button>
        </div>
    );
}

export default Home;
