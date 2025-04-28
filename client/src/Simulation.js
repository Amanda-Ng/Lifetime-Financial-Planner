import React, { useEffect, useState } from "react";
import "./Simulation.css";
import axios from "axios";
import { axiosClient } from "./services/apiClient";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

function Simulation() {
    const [editableScenarios, setEditableScenarios] = useState([]);
    const [readOnlyScenarios, setReadOnlyScenarios] = useState([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState("");
    const [user, setUser] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [numSimulations, setNumSimulations] = useState(1);
    const [showSuccessChart, setShowSuccessChart] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const headers = {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            };
            try {
                const [editableRes, readOnlyRes, userRes] = await Promise.all([
                    axiosClient.get("/api/scenarios/editable", { headers }),
                    axiosClient.get("/api/scenarios/readonly", { headers }),
                    axiosClient.get("/api/profile", { headers }),
                ]);
                setEditableScenarios(editableRes.data);
                setReadOnlyScenarios(readOnlyRes.data);
                setUser(userRes.data);
            } catch (error) {
                console.error("Error fetching scenarios or user:", error);
            }
        };

        fetchData();
    }, []);

    const handleGenerate = async () => {
        if (!selectedScenarioId || !user || !numSimulations) return;
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:8000/api/runSimulation", {
                scenarioId: selectedScenarioId,
                username: user.username,
                numSimulations,
            });

            setResult(response.data);
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const successChartData = result?.successProbability
        ? {
            labels: result.successProbability.map((d) => d.year),
            datasets: [
                {
                    label: "Probability of Success",
                    data: result.successProbability.map((d) => d.probability),
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    tension: 0.4,
                    fill: true,
                },
            ],
        }
        : null;

    const successChartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            tooltip: {
                enabled: true,
                callbacks: {
                    label: function (context) {
                        const year = context.label;
                        const probability = context.parsed.y;
                        return `Year: ${year}, Success Probability: ${probability.toFixed(2)}%`;
                    },
                },
            },
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Probability of Success Over Time",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Year" },
            },
            y: {
                title: { display: true, text: "Probability (%)" },
                min: 0,
                max: 100,
            },
        },
    };

    return (
        <div id="simulation-container">
            <div className="sim1">
                <div className="section_header"><strong>Simulation</strong></div>

                <div className="optionLine">
                    <label htmlFor="scenarioSelect">Choose scenario:</label>
                    <select
                        id="scenarioSelect"
                        value={selectedScenarioId}
                        onChange={(e) => setSelectedScenarioId(e.target.value)}
                    >
                        <option value="">-- Select Scenario --</option>
                        {editableScenarios.map((sc) => (
                            <option key={sc._id} value={sc._id}>
                                ✏️ {sc.name}
                            </option>
                        ))}
                        {readOnlyScenarios.map((sc) => (
                            <option key={sc._id} value={sc._id}>
                                👁️ {sc.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="optionLine">
                    <label htmlFor="numSimulations">Simulations</label>
                    <input
                        id="numSimulations"
                        type="number"
                        min="1"
                        value={numSimulations}
                        onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                    />
                </div>

                <div className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                        id="showSuccessChart"
                        type="checkbox"
                        checked={showSuccessChart}
                        onChange={(e) => setShowSuccessChart(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <label htmlFor="showSuccessChart" style={{ margin: 0 }}>
                        Show Probability of Success Chart
                    </label>
                </div>

                <div className="optionLine" id="genSimLine">
                    <button id="gen_button" onClick={handleGenerate} disabled={!selectedScenarioId || !user}>
                        {isLoading ? "Running..." : "Generate"}
                    </button>
                </div>
            </div>

            <div className="sim2">
                <div className="subsub_header"><strong>Scenario Output</strong></div>
                <div className="chart-container">
                    {result ? (
                        <>
                            {showSuccessChart && successChartData ? (
                                <Line data={successChartData} options={successChartOptions} />
                            ) : (
                                <pre style={{ fontSize: "0.9rem", overflowX: "scroll" }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            )}
                        </>
                    ) : (
                        <p>No data yet. Run the simulation to see results.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Simulation;
