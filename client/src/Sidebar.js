import React from "react";
import { Link } from "react-router-dom";
import "./App.css";
import useApp from "./hooks/useApp";

function Sidebar() {
  const { logout } = useApp();

  return (
    <div className="sidebar">
      <ul>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/">Dashboard</Link></li> {/* Dashboard is now the / landing page for website */}
        <li><Link to="/scenario">Scenarios</Link></li>
        <li><Link to="/investmentPage">Investments</Link></li>
        <li><Link to="/eventsPage">Events</Link></li>
        <li><Link to="/simulation">Simulation</Link></li>
        <li><a onClick={logout} href="/login"> Logout </a></li>
      </ul>
    </div>
  );
}

export default Sidebar;
