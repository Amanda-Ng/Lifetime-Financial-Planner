import React, { useState } from "react";
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
import ScenarioForm from "./ScenarioForm.js";

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
import Login from "./Login.js";
import Home from "./Home.js";
import Success from "./Success.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
// End TP

function App() {
    const [username, setUsername] = useState(() => {
        return localStorage.getItem("username") || undefined;
    });

    const handleUserUpdate = (newUsername) => {
        setUsername(newUsername);
        localStorage.setItem("username", newUsername)
    }

    return (
        <Router>
            <div className="App">
                <Navbar username={username}/>
                <Sidebar />
                <div className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/success" element={<Success />} />

                        {/* Protected Routes */}
                        <Route
                            path="/home"
                            element={
                                <PrivateRoute>
                                    <Home onUserUpdate={handleUserUpdate}/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/investment"
                            element={
                                <PrivateRoute>
                                    <InvestmentForm />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/scenario"
                            element={
                                <PrivateRoute>
                                    <Scenario />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/scenarioForm"
                            element={
                                <PrivateRoute>
                                    <ScenarioForm />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/simulation"
                            element={
                                <PrivateRoute>
                                    <Simulation />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/event"
                            element={
                                <PrivateRoute>
                                    <EventForm />
                                </PrivateRoute>
                            }
                        />
                        {/* Add more Routes here */}
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
