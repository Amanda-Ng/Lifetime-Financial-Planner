import React, { useEffect, useState } from "react";
import { axiosClient } from "./services/apiClient";
import axios from "axios";
import "./Scenario.css";
import { Link } from "react-router-dom";


function Scenario() {

    const [editableScenarios, setEditableScenarios] = useState([]);
    const [readOnlyScenarios, setReadOnlyScenarios] = useState([]);

    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const headers = {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                };
                const [editableRes, readOnlyRes] = await Promise.all([
                    axiosClient.get("/api/scenarios/editable", { headers }),
                    axiosClient.get("/api/scenarios/readonly", { headers })
                ]);
                setEditableScenarios(editableRes.data);
                setReadOnlyScenarios(readOnlyRes.data);
            } catch (error) {
                console.error("Error fetching scenarios:", error);
            }
        };

        fetchScenarios();
    }, []);

    const handleExportScenario = async (scenario) => {
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const response = await axios.get(`http://localhost:8000/api/scenarios/export/${scenario._id}`, {
                headers,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${scenario.name || "scenario"}.yaml`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting scenario:", error);
        }
    };


    return (
        <div id="scenario-container" >

            <h3>Your Editable Scenarios</h3>
            {editableScenarios.map((scenario) => (
                <div key={scenario._id} className="scenario1">
                    <div>
                        <img src="kite.png" alt="kite_icon" className="big_icon" />
                        <span className="subsub_header">{scenario.name}</span>
                        <div className="scenario-buttons">
                            <Link
                                to="/scenarioForm"
                                state={{ scenarioObject: scenario, isEditing: true, isViewing: false }}
                                className="edit-button"
                            >
                                ✏️ Edit
                            </Link>
                            <button
                                className="export-button"
                                onClick={() => handleExportScenario(scenario)}
                            >
                                📤 Export
                            </button>
                        </div>
                    </div>
                    <div>{/* !!Display chart here */}</div>
                </div>
            ))}

            <h3>Read-Only Scenarios Shared With You</h3>
            {readOnlyScenarios.map((scenario) => (
                <div key={scenario._id} className="scenario1">
                    <div>
                        <img src="kite.png" alt="kite_icon" className="big_icon" />
                        <span className="subsub_header">{scenario.name}</span>
                        <div className="scenario-buttons">
                            <Link
                                to="/scenarioForm"
                                state={{ scenarioObject: scenario, isEditing: false, isViewing: true }}
                                className="edit-button"
                            >
                                👁️ View
                            </Link>
                            <button
                                className="export-button"
                                onClick={() => handleExportScenario(scenario)}
                            >
                                📤 Export
                            </button>
                        </div>
                    </div>
                    <div>{/* !!Display chart here */}</div>
                </div>
            ))}

            <div className="scenario2">
                <div>
                    <img src="add.png" alt="add_icon" className="big_icon" />
                    <Link to="/scenarioForm" className="subsub_header">Create New Scenario</Link>
                </div>
                <div>
                    <img src="import.png" alt="import_icon" className="big_icon" />
                    <span className="subsub_header">Import Scenario</span>
                </div>



            </div>
        </div>

    )
}

export default Scenario