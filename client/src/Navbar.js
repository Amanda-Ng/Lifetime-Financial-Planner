import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

Navbar.propTypes = {
    username: PropTypes.func.isRequired,
};

function Navbar({ username }) {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <img src="headerIcon.png" alt="headerIcon" id="headerIcon" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
            <p onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                CitriFi
            </p>
            <button onClick={() => navigate("/profile")}>
                <img src="userPfp.png" alt="headerPfp" className="userPfp_small" />
                <span>{username || "Guest"}</span>
            </button>
        </nav>
    );
}

export default Navbar;
