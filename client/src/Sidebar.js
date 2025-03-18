import React from "react";
import "./App.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li><a href="#profile">Profile</a></li>
        <li><a href="#dashboard">Dashboard</a></li>
        <li><a href="#scenario">Scenario</a></li>
        <li><a href="#investment">Investment</a></li>
        <li><a href="#event">Event</a></li>
        <li><a href="#simulation">Simulation</a></li>
        <li><a href="#logout">Logout</a></li>
      </ul>
    </div>
  );
}

export default Sidebar;
