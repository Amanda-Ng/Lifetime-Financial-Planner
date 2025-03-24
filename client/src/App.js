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
import ScenarioForm from "./ScenarioForm.js"; 

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
import Login from "./Login.jsx";
import Home from "./Home.jsx";
import Success from "./Success.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
// End TP

function App() { 
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Sidebar />
                <div className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Login />} />
                        <Route path="/success" element={<Success />} />

                        {/* Protected Routes */}
                        <Route
                            path="/home"
                            element={
                                <PrivateRoute>
                                    <Home />
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
                            path="/dashboard"
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
                        {/* Add more Routes here */}
                    </Routes>
                </div>
            </div>
        </Router>
    ); 
}

export default App;
