import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./Sidebar";
import InvestmentForm from "./InvestmentForm";
import EventForm from "./EventForm";
import "./App.css";
import Navbar from "./Navbar.js";
import ProfilePage from "./ProfilePage.js";
import Scenario from "./Scenario.js";
import Simulation from "./Simulation.js";
import Dashboard from "./Dashboard.js";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/investment" element={<InvestmentForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/scenario" element={<Scenario />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/event" element={<EventForm />} />
            {/* Add more Routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
