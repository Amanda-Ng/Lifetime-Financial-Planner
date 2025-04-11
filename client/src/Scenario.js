import React, { useEffect, useState } from "react";
import { axiosClient } from "./services/apiClient";
import "./Scenario.css";
import { Link } from "react-router-dom";


function Scenario() {

    const [scenarios, setScenarios] = useState([]);

    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const response = await axiosClient.get("/api/scenarios", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setScenarios(response.data);
            } catch (error) {
                console.error("Error fetching scenarios:", error);
            }
        };

        fetchScenarios();
    }, []);

    return (
        <div id="scenario-container" >

            {scenarios.map((scenario) => (
                <div key={scenario._id} className="scenario1">
                    <div>
                        <img src="kite.png" alt="kite_icon" className="big_icon" />
                        <span className="subsub_header">{scenario.name}</span>
                        <Link
                            to="/scenarioForm"
                            state={{ scenarioObject: scenario, isEditing: true }}
                            className="edit-button"
                        >
                            ✏️ Edit
                        </Link>
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
                <div>
                    <img src="export.png" alt="export_icon" className="big_icon" />
                    <span className="subsub_header">Export Scenario</span>
                </div>



            </div>
        </div>

    )
}

export default Scenario