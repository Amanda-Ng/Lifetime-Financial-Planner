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
    BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend, BarElement);

function Simulation() {
    const [editableScenarios, setEditableScenarios] = useState([]);
    const [readOnlyScenarios, setReadOnlyScenarios] = useState([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState("");
    const [user, setUser] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [numSimulations, setNumSimulations] = useState(1);
    const [showSuccessChart, setShowSuccessChart] = useState(false);
    const [showShadedChart, setShowShadedChart] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState("totalInvestments");
    const [shadedChartData, setShadedChartData] = useState(null);
    const [financialGoal, setFinancialGoal] = useState(null);
    const [showStackedBarChart, setShowStackedBarChart] = useState(false);
    const [stackedChartQuantity, setStackedChartQuantity] = useState("investments");
    const [useMedianForStacked, setUseMedianForStacked] = useState(true);
    const [aggregationThreshold, setAggregationThreshold] = useState(1000);
    const [stackedChartData, setStackedChartData] = useState(null);

    //1D charts 
    const [simulations_1d, setSimulations_1d] = useState(null);
    const [multiLineCharts_1d, setMultiLineCharts] = useState(null);
    const [showMultiLineCharts, setShowMultiLineCharts] = useState(false);
    const [lineCharts_1d, setLineCharts_1d] = useState(null); 
    const [showLineCharts_1d, setShowLineCharts_1d] = useState(false);

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
            let response;
            if (showShadedChart) {
                // Shaded chart simulation
                response = await axios.post("http://localhost:8000/api/runSimulationWithRanges", {
                    scenarioId: selectedScenarioId,
                    username: user.username,
                    numSimulations,
                    selectedQuantity,
                });
                setShadedChartData(response.data.aggregatedData);
            }
            if (showSuccessChart) {
                // Success probability simulation
                response = await axios.post("http://localhost:8000/api/runSimulation", {
                    scenarioId: selectedScenarioId,
                    username: user.username,
                    numSimulations,
                });
                setResult(response.data);
            }
            if (showStackedBarChart) {
                // Stacked bar chart simulation
                response = await axios.post("http://localhost:8000/api/runStackedBarChart", {
                    scenarioId: selectedScenarioId,
                    username: user.username,
                    numSimulations,
                    selectedQuantity: stackedChartQuantity,
                    aggregationThreshold,
                    useMedian: useMedianForStacked,
                });

                const data = await response.json();
                setStackedChartData(data.aggregatedData);
            }
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

    const shadedChartDataObject = shadedChartData
        ? {
            labels: shadedChartData.map((d) => d.year),
            datasets: [
                {
                    label: "Median",
                    data: shadedChartData.map((d) => d.median),
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: "10%-90%",
                    data: shadedChartData.map((d) => d?.ranges?.["10-90"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.1)",
                    fill: "-1",
                },
                {
                    label: "20%-80%",
                    data: shadedChartData.map((d) => d?.ranges?.["20-80"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.2)",
                    fill: "-1",
                },
                {
                    label: "30%-70%",
                    data: shadedChartData.map((d) => d?.ranges?.["30-70"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.3)",
                    fill: "-1",
                },
                {
                    label: "40%-60%",
                    data: shadedChartData.map((d) => d?.ranges?.["40-60"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.4)",
                    fill: "-1",
                },
                ...(selectedQuantity === "totalInvestments" && financialGoal !== null
                    ? [{
                        label: "Financial Goal",
                        data: shadedChartData.map(() => financialGoal),
                        borderColor: "red",
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                    }]
                    : [])
            ],
        }
        : null;

    const shadedChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Shaded Probability Ranges Over Time",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Year" },
            },
            y: {
                title: { display: true, text: "Value" },
            },
        },
    };

    const getRandomColor = () =>
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
            Math.random() * 255
        )}, 0.7)`;

    const getStackedBarData = (aggregatedData, quantity) => {
        const labels = aggregatedData.map((data) => data.year);
        const categoryMap = {};

        aggregatedData.forEach((data) => {
            data[quantity].forEach(({ name }) => {
                if (!categoryMap[name]) {
                    categoryMap[name] = {
                        label: name,
                        backgroundColor: getRandomColor(),
                        data: [],
                    };
                }
            });
        });

        aggregatedData.forEach((data) => {
            const categoryValues = {};
            data[quantity].forEach(({ name, value }) => {
                categoryValues[name] = value;
            });

            Object.keys(categoryMap).forEach((name) => {
                categoryMap[name].data.push(categoryValues[name] || 0);
            });
        });

        return {
            labels,
            datasets: Object.values(categoryMap),
        };
    };

    const stackedBarOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw.toFixed(2)}`,
                },
            },
            legend: { position: "top" },
        },
        scales: {
            x: { stacked: true },
            y: { stacked: true },
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
                        onChange={(e) => {
                            const scenarioId = e.target.value;
                            setSelectedScenarioId(scenarioId);

                            const scenario = [...editableScenarios, ...readOnlyScenarios].find(sc => sc._id === scenarioId);
                            if (scenario?.financial_goal) {
                                setFinancialGoal(scenario.financial_goal);
                            } else {
                                setFinancialGoal(null);
                            }
                        }}                    >
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

                <div className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                        id="showShadedChart"
                        type="checkbox"
                        checked={showShadedChart}
                        onChange={(e) => setShowShadedChart(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <label htmlFor="showShadedChart" style={{ margin: 0 }}>
                        Show Shaded Line Chart
                    </label>
                </div>

                {showShadedChart && (
                    <div className="optionLine2">
                        <label htmlFor="quantitySelect">Select Quantity:</label>
                        <select
                            id="quantitySelect"
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(e.target.value)}
                        >
                            <option value="totalInvestments">Total Investments</option>
                            <option value="totalIncome">Total Income</option>
                            <option value="totalExpenses">Total Expenses</option>
                            <option value="earlyWithdrawalTax">Early Withdrawal Tax</option>
                            <option value="discretionaryExpensePercentage">Discretionary Expense %</option>
                        </select>
                    </div>
                )}

                <div className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                        id="showStackedBarChart"
                        type="checkbox"
                        checked={showStackedBarChart}
                        onChange={(e) => setShowStackedBarChart(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <label htmlFor="showStackedBarChart" style={{ margin: 0 }}>
                        Show Stacked Bar Chart
                    </label>
                </div>

                {showStackedBarChart && (
                    <>
                        <div className="optionLine2">
                            <label htmlFor="stackedQuantitySelect">Quantity:</label>
                            <select
                                id="stackedQuantitySelect"
                                value={stackedChartQuantity}
                                onChange={(e) => setStackedChartQuantity(e.target.value)}
                            >
                                <option value="investments">Investments</option>
                                <option value="income">Income</option>
                                <option value="expenses">Expenses</option>
                            </select>
                        </div>

                        <div className="optionLine2">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={useMedianForStacked}
                                    onChange={(e) => setUseMedianForStacked(e.target.checked)}
                                />
                                Use Median (unchecked = Average)
                            </label>
                        </div>

                        <div className="optionLine2">
                            <label htmlFor="aggregationThreshold">Aggregation Threshold:</label>
                            <input
                                id="aggregationThreshold"
                                type="number"
                                value={aggregationThreshold}
                                onChange={(e) => setAggregationThreshold(parseFloat(e.target.value))}
                            />
                        </div>
                    </>
                )}

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
                {/*Generate button*/}
                <div className="optionLine" id="genSimLine">
                    <button id="gen_button" onClick={handleGenerate} disabled={!selectedScenarioId || !user}>
                        {isLoading ? "Running..." : "Generate"}
                    </button>
                </div>
            </div>

            <div className="sim2">
                <div className="subsub_header"><strong>Scenario Output</strong></div>
                <div className="chart-container">
                    {result || shadedChartData ? (
                        <>
                            {showSuccessChart && successChartData && (
                                <div className="chart-wrapper">
                                    <Line data={successChartData} options={successChartOptions} />
                                </div>
                            )}
                            {showShadedChart && shadedChartData && (
                                <div className="chart-wrapper">
                                    <Line data={shadedChartDataObject} options={shadedChartOptions} />
                                </div>
                            )}
                            {!showSuccessChart && !showShadedChart && (
                                <pre style={{ fontSize: "0.9rem", overflowX: "scroll" }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            )}
                            {showStackedBarChart && stackedChartData && (
                                <div className="chart-wrapper">
                                    <Bar data={getStackedBarData(stackedChartData, stackedChartQuantity)} options={stackedBarOptions} />
                                </div>
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

export default Simulation