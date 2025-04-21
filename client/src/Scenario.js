import React, { useEffect, useState } from "react";
import { axiosClient } from "./services/apiClient";
import { axiosClientImport } from "./services/apiClient";
import axios from "axios";
import "./Scenario.css";
import { Link } from "react-router-dom";


function Scenario() {

    const [editableScenarios, setEditableScenarios] = useState([]);
    const [readOnlyScenarios, setReadOnlyScenarios] = useState([]);
    const [importFile, setFile] = useState(null);

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

    const handleUploadImport = (e) => {
        setFile(e.target.files[0]);
    };

    //make request to import scenario
    const handleImportScenario = async (e) => {
        e.preventDefault();
        if (!importFile) {
            alert("Please select a file first!");
            return;
        }
        try {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            const formData = new FormData();
            formData.append('file', importFile);
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            const response = await axiosClientImport.post("api/importScenario", formData, {
                headers
            });
            alert(response.data.message);
            console.log("upload success")
        } catch (error) {
            if (error.response) {
                //server send back err
                alert(`Error: ${error.response.data.message}`);
                console.log("upload err: " + error.response.data.message)
            } else {
                alert("Unexpected error occurred.");
                console.log("upload err")
            }
        }
    };


    return (
        <div id="scenario-container" >

            <div className="scenario2">
                <div>
                    <img src="add.png" alt="add_icon" className="big_icon" />
                    <Link to="/scenarioForm" className="subsub_header">Create New Scenario</Link>
                </div>
                <div>
                    <img src="import.png" alt="import_icon" className="big_icon" />
                    <span className="subsub_header">Import Scenario</span>
                    <form id="uploadForm" onSubmit={handleImportScenario} encType="multipart/form-data">
                        <input type="file" id="scenarioYaml" name="file" accept=".yaml,.yml" onChange={handleUploadImport} required />
                        <button type="submit">Upload</button>
                    </form>
                </div>
            </div>

            <h3>My Editable Scenarios</h3>
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

            <h3>Read-Only Scenarios Shared With Me</h3>
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
        </div>

    )
}

export default Scenario