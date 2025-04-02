import React from "react";
import PropTypes from "prop-types";
import "./Navbar.css";

Navbar.propTypes = {
    username: PropTypes.func.isRequired,
};

function Navbar({ username }) {
    return (
        <nav className="navbar">
            <img src="headerIcon.png" alt="headerIcon" id="headerIcon" />
            <p>CitriFi</p>
            <button>
                <img src="userPfp.png" alt="headerPfp" className="userPfp_small" />
                <span>{username || "Guest"}</span>
            </button>
        </nav>
    );
}

export default Navbar;
