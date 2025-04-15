import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "./services/apiClient";
import "./Dashboard.css";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [investments, setInvestments] = useState([]);
    const [events, setEvents] = useState([]);
    const [editableScenarios, setEditableScenarios] = useState([]);
    const [readOnlyScenarios, setReadOnlyScenarios] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                };

                const [userResponse, investmentsResponse, eventResponse, editableRes, readOnlyRes] = await Promise.all([
                    axiosClient.get('/api/profile', { headers }),
                    axiosClient.get('/api/getUserInvestments', { headers }),
                    axiosClient.get('/api/getUserEvents', { headers }),
                    axiosClient.get('/api/scenarios/editable', { headers }),
                    axiosClient.get('/api/scenarios/readonly', { headers }),
                ]);

                setUser(userResponse.data.username);
                setInvestments(investmentsResponse.data);
                setEvents(eventResponse.data);
                setEditableScenarios(editableRes.data);
                setReadOnlyScenarios(readOnlyRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchData();
    }, []);

    const renderItemCards = (items, type) => {
        return (
            <div className="preview_cards">
                {items.slice(0, 5).map((item, i) => (
                    <div className="item_card" key={i}>
                        {type === "investment"
                            ? item.investmentType?.name || "Untitled"
                            : item.name || "Untitled"}
                    </div>
                ))}
                {items.length > 5 && (
                    <div className="item_card more">+{items.length - 5} more</div>
                )}
            </div>
        );
    };

    return (
        <div className="dash_container">
            <h2>{user}'s Dashboard</h2>

            <div className="dash_section">
                <div className="dash_header" onClick={() => navigate("/investmentPage")}>
                    <strong>{investments.length}</strong> Investments
                </div>
                {renderItemCards(investments, "investment")}
                <button className="dash_button" onClick={() => navigate("/investment")}>
                    ➕ Create New Investment
                </button>
            </div>

            <div className="dash_section">
                <div className="dash_header" onClick={() => navigate("/eventsPage")}>
                    <strong>{events.length}</strong> Event Series
                </div>
                {renderItemCards(events, "event")}
                <button className="dash_button" onClick={() => navigate("/event")}>
                    ➕ Create New Event Series
                </button>
            </div>

            <div className="dash_section">
                <div className="dash_header" onClick={() => navigate("/scenario")}>
                    <strong>{editableScenarios.length + readOnlyScenarios.length}</strong> Scenarios
                </div>
                {renderItemCards([...editableScenarios, ...readOnlyScenarios], "scenario")}
                <button className="dash_button" onClick={() => navigate("/scenarioForm")}>
                    ➕ Create New Scenario
                </button>
            </div>
        </div>
    );
}

export default Dashboard;
