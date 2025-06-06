// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
// Proof of concept for Google OAuth and using apiClient to make authenticated requests
// isAuthenticated route is protected by JWT token
// apiClient is a wrapper around axios to make authenticated requests
// modified slightly to be a JS file instead of JSX and add popup window

import { useEffect, useState, React } from "react";
import PropTypes from "prop-types";
import useApp from "./hooks/useApp";
import { axiosClient } from "./services/apiClient";
import { useNavigate } from "react-router-dom";
import "./Home.css";

Home.propTypes = {
    onUserUpdate: PropTypes.func.isRequired
};

function Home({ onUserUpdate }) {
    const navigate = useNavigate(); // Move useNavigate inside the component
    const { token, logout } = useApp();
    const [user, setUser] = useState(null);
    const [age, setAge] = useState(""); // store user's age
    const [showPopup, setShowPopup] = useState(false); // control visibility of popup based on the age input

    useEffect(() => {
        (async () => {
            try {
                const { data: user } = await axiosClient.get("/api/profile", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUser(user);
                onUserUpdate(user.username)
                setAge(user.age);
                if (user.age) {
                    navigate("/");
                } else {
                    setShowPopup(true);
                }
            } catch (error) {
                console.error(error.response);
            }
        })();
    }, [navigate, onUserUpdate]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosClient.get("/isAuthenticated", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setUser(data.user);
            } catch (err) {
                console.log(err.response);
            }
        })();
    }, [token]);

    const handleAgeSubmit = async () => {
        if (age.trim() === "" || isNaN(age) || age <= 0) {
            alert("Please enter a valid age.");
            return;
        }

        try {
            // Send the age to the backend
            await axiosClient.post(
                "/updateAge",
                { age },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setShowPopup(false); // close popup
            navigate("/");
        } catch (error) {
            console.error("Error saving age to the database:", error);
            alert("Failed to save age. Please try again.");
        }
    };

    return (
        <div className="p-4">
            {showPopup && (
                <div className="popup_container">
                    <div>
                        <h2>Please Enter Your Age</h2>
                        <input className="age_input" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" />
                        <br />
                        <button className="submit_age_button" onClick={handleAgeSubmit}>
                            Submit
                        </button>
                    </div>
                </div>
            )}
            <h1 className="text-2x1"> {user?.username} </h1>
            <p className="text-zinc-500"> This is a protected page. </p>
            <button onClick={logout} className="mt-4">
                Logout
            </button>
        </div>
    );
}

export default Home;
