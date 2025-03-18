import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li><Link to="#profile">Profile</Link></li>
        <li><Link to="#dashboard">Dashboard</Link></li>
        <li><Link to="#scenario">Scenario</Link></li>
        <li><Link to="/investment">Investment</Link></li>
        <li><Link to="#event">Event</Link></li>
        <li><Link to="#simulation">Simulation</Link></li>
        <li><Link to="#logout">Logout</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;
