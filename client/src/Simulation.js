import React, { useEffect, useState, useMemo } from "react";
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
    const [successProbabilityData, setSuccessProbabilityData] = useState(null);
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
    const [scenarioEvents, setScenarioEvents] = useState([]);
    const [scenarioInvests, setScenarioInvests] = useState([]);
    
    const [multiLineCharts_1d, setMultiLineCharts] = useState(null);
    const [showMultiLineCharts, setShowMultiLineCharts] = useState(false);
    const [MCParamType_1d, setMCParamType_1d] = useState([]);
    {/*options: enableRoth , eventStart, eventDuration, initAmt_income, initAmt_expense?, assetPercent*/}
    const [MC_enableRoth, setMCEnableRoth] = useState(false); 
    {/*params: {objId, min, max, step}*/}
    const [MC_eventStartParams, setMCEventStartParams] = useState(null);  
    const [MC_eventDurationParams, setMCEventDurationParams] = useState(null); 
    const [MC_initAmt_incomeParams, setMCInitAmt_incomeParams] = useState(null); 
    const [MC_initAmt_expenseParams, setMCInitAmt_expenseParams] = useState(null); 
    const [MC_assetPercentParams, setMCAssetPercentParams] = useState(null);       

    const [lineCharts_1d, setLineCharts_1d] = useState(null);
    const [showLineCharts_1d, setShowLineCharts_1d] = useState(false);
    const [LCParamType, setLCParamType] = useState("");

    const [LC_enableRoth, setLCEnableRoth] = useState(false); 
    const [LC_eventStartParams, setLCEventStartParams] = useState(null);  
    const [LC_eventDurationParams, setLCEventDurationParams] = useState(null); 
    const [LC_initAmt_incomeParams, setLCInitAmt_incomeParams] = useState(null); 
    const [LC_initAmt_expenseParams, setLCInitAmt_expenseParams] = useState(null); 
    const [LC_assetPercentParams, setLCAssetPercentParams] = useState(null);

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

    //get scenario events and investments 
    useEffect(() => {
        const getScenarioEventsInvests = async () => {
            if (!selectedScenarioId) return;
            //get scenario by id
            const allScenarios = [...editableScenarios, ...readOnlyScenarios];
            const selectedScenario = allScenarios.find(s => s._id === selectedScenarioId);
            if (selectedScenario) {
                setScenarioInvests(selectedScenario.investments || []);
                setScenarioEvents(selectedScenario.event_series || []);
            } else {
                setScenarioInvests([]);
                setScenarioEvents([]);
            }
        };
        getScenarioEventsInvests();
    }, [selectedScenarioId]);



    // const handleGenerate = async () => {
    //     if (!selectedScenarioId || !user || !numSimulations) return;
    //     setIsLoading(true);

    //     try {
    //         let response;
    //         if (showShadedChart) {
    //             // Shaded chart simulation
    //             response = await axios.post("http://localhost:8000/api/runSimulationWithRanges", {
    //                 scenarioId: selectedScenarioId,
    //                 username: user.username,
    //                 numSimulations,
    //             });
    //             setShadedChartData(response.data);
    //         }
    //         if (showSuccessChart) {
    //             // Success probability simulation
    //             response = await axios.post("http://localhost:8000/api/runSimulation", {
    //                 scenarioId: selectedScenarioId,
    //                 username: user.username,
    //                 numSimulations,
    //             });
    //             setResult(response.data);
    //         }
    //         if (showStackedBarChart) {
    //             // Stacked bar chart simulation
    //             response = await axios.post("http://localhost:8000/api/runStackedBarChart", {
    //                 scenarioId: selectedScenarioId,
    //                 username: user.username,
    //                 numSimulations,
    //                 selectedQuantity: stackedChartQuantity,
    //                 aggregationThreshold,
    //                 useMedian: useMedianForStacked,
    //             });

    //             setStackedChartData(response.data.aggregatedData);
    //         }
    //     } catch (error) {
    //         console.error("Simulation failed:", error);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleGenerate = async () => {
        if (!selectedScenarioId || !user || !numSimulations) return;
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:8000/api/runAllSimulations", {
                scenarioId: selectedScenarioId,
                username: user.username,
                numSimulations,
                stackedChartQuantity,
                aggregationThreshold,
                useMedian: useMedianForStacked,
            });

            const { successProbability, shadedChartData, stackedChartData } = response.data;

            if (showSuccessChart) {
                setSuccessProbabilityData(successProbability);
            }
            if (showShadedChart) {
                setShadedChartData(shadedChartData);
            }
            if (showStackedBarChart) {
                setStackedChartData(stackedChartData);
            }
            console.log("checking 1d")
            //1d chart generation 
            if((showMultiLineCharts && MCParamType_1d!=[]) ||
                (showLineCharts_1d && LCParamType!=[])
            ){
                console.log("running 1d")
                const response2 = await axios.post("http://localhost:8000/api/run1DSimulations", {
                    scenarioId: selectedScenarioId,
                    username: user.username,
                    numSimulations, 
                    MCParamType_1d, 
                    MC_enableRoth,
                    MC_eventStartParams,
                    MC_eventDurationParams,
                    MC_initAmt_incomeParams,
                    MC_initAmt_expenseParams,
                    MC_assetPercentParams,

                    LCParamType,
                    LC_enableRoth,
                    LC_eventStartParams,
                    LC_eventDurationParams,
                    LC_initAmt_incomeParams,
                    LC_initAmt_expenseParams,
                    LC_assetPercentParams
                });
                console.log(response2.data)
            } 
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };



    const successChartData = successProbabilityData ? {
        labels: successProbabilityData.map((d) => d.year),
        datasets: [
            {
                label: "Probability of Success",
                data: successProbabilityData.map((d) => d.probability),
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

    const selectedData = useMemo(() => {
        if (!shadedChartData || !shadedChartData[selectedQuantity]) return [];
        return shadedChartData[selectedQuantity];
    }, [shadedChartData, selectedQuantity]);

    const shadedChartDataObject = selectedData.length
        ? {
            labels: selectedData.map((d) => d.year),
            datasets: [
                // Median Line
                {
                    label: "Median",
                    data: selectedData.map((d) => d.median),
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                },
                // 10% - 90%
                {
                    label: "10%",
                    data: selectedData.map((d) => d?.ranges?.["10-90"]?.[0] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.1)",
                    borderColor: "rgba(0, 0, 255, 0.1)",
                },
                {
                    label: "90%",
                    data: selectedData.map((d) => d?.ranges?.["10-90"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.1)",
                    borderColor: "rgba(0, 0, 255, 0.1)",
                },
                // 20% - 80%
                {
                    label: "20%",
                    data: selectedData.map((d) => d?.ranges?.["20-80"]?.[0] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.2)",
                    borderColor: "rgba(0, 0, 255, 0.2)",
                },
                {
                    label: "80%",
                    data: selectedData.map((d) => d?.ranges?.["20-80"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.2)",
                    borderColor: "rgba(0, 0, 255, 0.2)",
                },
                // 30% - 70%
                {
                    label: "30%",
                    data: selectedData.map((d) => d?.ranges?.["30-70"]?.[0] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.3)",
                    borderColor: "rgba(0, 0, 255, 0.3)",
                },
                {
                    label: "70%",
                    data: selectedData.map((d) => d?.ranges?.["30-70"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.3)",
                    borderColor: "rgba(0, 0, 255, 0.3)",
                },
                // 40% - 60%
                {
                    label: "40%",
                    data: selectedData.map((d) => d?.ranges?.["40-60"]?.[0] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.4)",
                    borderColor: "rgba(0, 0, 255, 0.4)",
                },
                {
                    label: "60%",
                    data: selectedData.map((d) => d?.ranges?.["40-60"]?.[1] ?? null),
                    backgroundColor: "rgba(0, 0, 255, 0.4)",
                    borderColor: "rgba(0, 0, 255, 0.4)",
                },
                ...(selectedQuantity === "totalInvestments" && financialGoal !== null
                    ? [{
                        label: "Financial Goal",
                        data: selectedData.map(() => financialGoal),
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
                <h3>One-dimensional scenario exploration</h3>
                {/*Multi-line chart*/}
                <div className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                        id="showMultiLineCharts"
                        type="checkbox"
                        checked={showMultiLineCharts}  
                        onChange={(e) => setShowMultiLineCharts(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <label htmlFor="showMultiLineCharts" style={{ margin: 0 }}>
                        Show Multi-line chart
                    </label>
                </div>
                
                {/*options: enableRoth , eventStart, eventDuration, initAmt_income, initAmt_expense?, assetPercent*/} 
                {showMultiLineCharts && (
                    <div>
                        <label>Select parameters:</label>
                        {[
                            { label: "Enable Roth Optimizer", value: "enableRoth" },
                            { label: "Event Start", value: "eventStart" },
                            { label: "Event Duration", value: "eventDuration" },
                            { label: "Income Event: Initial Amount", value: "initAmt_income" },
                            { label: "Expense Event: Initial Amount", value: "initAmt_expense" },
                            { label: "Asset Allocation Percent", value: "assetPercent" },
                        ].map((option) => (
                            <div key={option.value} className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <label>
                                <input
                                    type="checkbox"
                                    value={option.value}
                                    checked={MCParamType_1d.includes(option.value)}
                                    style={{ marginLeft: "2rem", marginRight:0 }}
                                    onChange={(e) => {
                                    if (e.target.checked) {
                                        setMCParamType_1d([...MCParamType_1d, option.value]);
                                    } else {
                                        setMCParamType_1d(
                                        MCParamType_1d.filter((v) => v !== option.value)
                                        );
                                    }
                                    }}
                                />
                                {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
     
                {showMultiLineCharts && MCParamType_1d.includes("enableRoth") && (
                    <div className="optionLine2">
                        <label htmlFor="enableRothSelect">Roth Optimizer:</label>
                        <select
                        id="enableRothSelect"
                        value={MC_enableRoth ? "enable" : "disable"}
                        onChange={(e) => setMCEnableRoth(e.target.value === "enable")}
                        >
                        <option value="enable">Enable</option>
                        <option value="disable">Disable</option>
                        </select>
                    </div>
                )} 
                {showMultiLineCharts && MCParamType_1d.includes("eventStart") && (
                    <div className="optionLine2" >
                        <label>Event Start Parameters:</label>
                        <div >
                            <div >
                                <label htmlFor="eventStartObj">Event:</label>
                                <select
                                    id="eventStartObj"
                                    value={MC_eventStartParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        console.log("found id ",e.target.value )
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        console.log("found obj ",selectedObj )
                                        setMCEventStartParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))} 
                                </select>
                            </div>

                            <div>
                                <label htmlFor="eventStartMin">Min:</label>
                                <input
                                    id="eventStartMin"
                                    type="number"
                                    value={MC_eventStartParams?.min ?? ""}
                                    onChange={(e) =>
                                        setMCEventStartParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventStartMax">Max:</label>
                                <input
                                    id="eventStartMax"
                                    type="number"
                                    value={MC_eventStartParams?.max ?? ""}
                                    onChange={(e) =>
                                        setMCEventStartParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventStartStep">Step:</label>
                                <input
                                    id="eventStartStep"
                                    type="number"
                                    value={MC_eventStartParams?.step ?? ""}
                                    onChange={(e) =>
                                        setMCEventStartParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )} 
                {showMultiLineCharts && MCParamType_1d.includes("eventDuration") && (
                    <div className="optionLine2">
                        <label>Event Duration Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="eventDurationObj">Event:</label>
                                <select
                                id="eventDurationObj"
                                value={MC_eventDurationParams?.obj?._id || ""}
                                onChange={(e) => {
                                    const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                    setMCEventDurationParams(prev => ({ ...prev, obj: selectedObj }));
                                }}
                                >
                                <option value="">Select</option>
                                {scenarioEvents.map((event) => (
                                    <option key={event._id} value={event._id}>
                                    {event.name}
                                    </option>
                                ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="eventDurationMin">Min:</label>
                                <input
                                id="eventDurationMin"
                                type="number"
                                value={MC_eventDurationParams?.min ?? ""}
                                onChange={(e) =>
                                    setMCEventDurationParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventDurationMax">Max:</label>
                                <input
                                id="eventDurationMax"
                                type="number"
                                value={MC_eventDurationParams?.max ?? ""}
                                onChange={(e) =>
                                    setMCEventDurationParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventDurationStep">Step:</label>
                                <input
                                id="eventDurationStep"
                                type="number"
                                value={MC_eventDurationParams?.step ?? ""}
                                onChange={(e) =>
                                    setMCEventDurationParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                }
                                />
                            </div>
                        </div>
                    </div>
                )}
                {showMultiLineCharts && MCParamType_1d.includes("initAmt_income") && (
                    <div className="optionLine2">
                        <label>Income Event: Initial Amount Parameters:</label>      
                        <div>
                            <div>
                                <label htmlFor="initAmtIncomeObj">Event:</label>
                                <select
                                id="initAmtIncomeObj"
                                value={MC_initAmt_incomeParams?.obj?._id || ""}
                                onChange={(e) => {
                                    const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                    setMCInitAmt_incomeParams(prev => ({ ...prev, obj: selectedObj }));
                                }}
                                >
                                <option value="">Select</option>
                                {scenarioEvents
                                    .filter(event => event.eventType === "income")
                                    .map((event) => (
                                    <option key={event._id} value={event._id}>
                                        {event.name}
                                    </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeMin">Min:</label>
                                <input
                                id="initAmtIncomeMin"
                                type="number"
                                value={MC_initAmt_incomeParams?.min ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_incomeParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeMax">Max:</label>
                                <input
                                id="initAmtIncomeMax"
                                type="number"
                                value={MC_initAmt_incomeParams?.max ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_incomeParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeStep">Step:</label>
                                <input
                                id="initAmtIncomeStep"
                                type="number"
                                value={MC_initAmt_incomeParams?.step ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_incomeParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                }
                                />
                            </div>
                        </div>
                    </div>
                )}
                {showMultiLineCharts && MCParamType_1d.includes("initAmt_expense") && (
                    <div className="optionLine2">
                        <label>Expense Event: Initial Amount Parameters:</label>
                        <div>  
                            <div> 
                                <label htmlFor="initAmtExpenseObj">Event:</label> 
                                <select
                                    id="initAmtExpenseObj"
                                    value={MC_initAmt_expenseParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setMCInitAmt_expenseParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                <option value="">Select</option>
                                {scenarioEvents
                                    .filter(event => event.eventType === "expense")
                                    .map((event) => (
                                    <option key={event._id} value={event._id}>
                                        {event.name}
                                    </option>
                                    ))}
                                </select>
                            </div> 
                            <div>
                                <label htmlFor="initAmtExpenseMin">Min:</label>
                                <input
                                id="initAmtExpenseMin"
                                type="number"
                                value={MC_initAmt_expenseParams?.min ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_expenseParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtExpenseMax">Max:</label>
                                <input
                                id="initAmtExpenseMax"
                                type="number"
                                value={MC_initAmt_expenseParams?.max ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_expenseParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtExpenseStep">Step:</label>
                                <input
                                id="initAmtExpenseStep"
                                type="number"
                                value={MC_initAmt_expenseParams?.step ?? ""}
                                onChange={(e) =>
                                    setMCInitAmt_expenseParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showMultiLineCharts && MCParamType_1d.includes("assetPercent") && (
                    <div className="optionLine2">
                        <label>Asset Allocation Percent Parameters:</label>      
                        <div>
                            <div>
                                <label htmlFor="assetPercentObj">Event:</label>
                                <select
                                    id="assetPercentObj"
                                    value={MC_assetPercentParams?.obj?._id || ""}
                                    onChange={(e) => {  
                                        const selectedObj = scenarioEvents.find(inv => inv._id === e.target.value); 
                                        setMCAssetPercentParams(prev => ({ ...prev, obj: selectedObj })); 
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents
                                        .filter(event => 
                                            event.eventType === "invest" && 
                                            (
                                                (event.assetAllocationType === "glidepath" && (event.initialAllocation.filter(val => val !== 0).length === 2)) || 
                                                (event.assetAllocationType !== "glidepath" && event.fixedAllocation.filter(val => val !== 0).length === 2)
                                            )
                                        )
                                        .map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                    </option>
                                    ))} 
                                </select>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label htmlFor="assetPercentMin">Min:</label>
                                <input
                                    id="assetPercentMin"
                                    type="number"
                                    value={MC_assetPercentParams?.min ?? ""}
                                    onChange={(e) =>
                                        setMCAssetPercentParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label htmlFor="assetPercentMax">Max:</label>
                                <input
                                    id="assetPercentMax"
                                    type="number"
                                    value={MC_assetPercentParams?.max ?? ""}
                                    onChange={(e) =>
                                        setMCAssetPercentParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label htmlFor="assetPercentStep">Step:</label>
                                <input
                                    id="assetPercentStep"
                                    type="number"
                                    value={MC_assetPercentParams?.step ?? ""}
                                    onChange={(e) =>
                                        setMCAssetPercentParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Line chart */}
                <div className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                        id="showLineCharts_1d"
                        type="checkbox"
                        checked={showLineCharts_1d}
                        onChange={(e) => setShowLineCharts_1d(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <label htmlFor="showLineCharts_1d" style={{ margin: 0 }}>
                        Show Line chart
                    </label>
                </div>

                {/* Parameter selectors */}
                {showLineCharts_1d && showLineCharts_1d && (
                    <div>
                        <label>Select parameters:</label>
                        {[
                            //{ label: "Enable Roth Optimizer", value: "enableRoth" },
                            { label: "Event Start", value: "eventStart" },
                            { label: "Event Duration", value: "eventDuration" },
                            { label: "Income Event: Initial Amount", value: "initAmt_income" },
                            { label: "Expense Event: Initial Amount", value: "initAmt_expense" },
                            { label: "Asset Allocation Percent", value: "assetPercent" },
                        ].map((option) => (
                            <div key={option.value} className="optionLine" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        value={option.value}
                                        checked={LCParamType.includes(option.value)}
                                        style={{ marginLeft: "2rem", marginRight: 0 }}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setLCParamType([...LCParamType, option.value]);
                                            } else {
                                                setLCParamType(LCParamType.filter((v) => v !== option.value));
                                            }
                                        }}
                                    />
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("enableRoth") && (
                    <div className="optionLine2">
                        <label htmlFor="enableRothSelect">Roth Optimizer:</label>
                        <select
                            id="enableRothSelect"
                            value={LC_enableRoth ? "enable" : "disable"}
                            onChange={(e) => setLCEnableRoth(e.target.value === "enable")}
                        >
                            <option value="enable">Enable</option>
                            <option value="disable">Disable</option>
                        </select>
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("eventStart") && (
                    <div className="optionLine2">
                        <label>Event Start Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="eventStartObj">Event:</label>
                                <select
                                    id="eventStartObj"
                                    value={LC_eventStartParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setLCEventStartParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="eventStartMin">Min:</label>
                                <input
                                    id="eventStartMin"
                                    type="number"
                                    value={LC_eventStartParams?.min ?? ""}
                                    onChange={(e) =>
                                        setLCEventStartParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventStartMax">Max:</label>
                                <input
                                    id="eventStartMax"
                                    type="number"
                                    value={LC_eventStartParams?.max ?? ""}
                                    onChange={(e) =>
                                        setLCEventStartParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventStartStep">Step:</label>
                                <input
                                    id="eventStartStep"
                                    type="number"
                                    value={LC_eventStartParams?.step ?? ""}
                                    onChange={(e) =>
                                        setLCEventStartParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("eventDuration") && (
                    <div className="optionLine2">
                        <label>Event Duration Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="eventDurationObj">Event:</label>
                                <select
                                    id="eventDurationObj"
                                    value={LC_eventDurationParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setLCEventDurationParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="eventDurationMin">Min:</label>
                                <input
                                    id="eventDurationMin"
                                    type="number"
                                    value={LC_eventDurationParams?.min ?? ""}
                                    onChange={(e) =>
                                        setLCEventDurationParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventDurationMax">Max:</label>
                                <input
                                    id="eventDurationMax"
                                    type="number"
                                    value={LC_eventDurationParams?.max ?? ""}
                                    onChange={(e) =>
                                        setLCEventDurationParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="eventDurationStep">Step:</label>
                                <input
                                    id="eventDurationStep"
                                    type="number"
                                    value={LC_eventDurationParams?.step ?? ""}
                                    onChange={(e) =>
                                        setLCEventDurationParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("initAmt_income") && (
                    <div className="optionLine2">
                        <label>Income Event: Initial Amount Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="initAmtIncomeObj">Event:</label>
                                <select
                                    id="initAmtIncomeObj"
                                    value={LC_initAmt_incomeParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setLCInitAmt_incomeParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.filter(event => event.eventType === "income").map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeMin">Min:</label>
                                <input
                                    id="initAmtIncomeMin"
                                    type="number"
                                    value={LC_initAmt_incomeParams?.min ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_incomeParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeMax">Max:</label>
                                <input
                                    id="initAmtIncomeMax"
                                    type="number"
                                    value={LC_initAmt_incomeParams?.max ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_incomeParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtIncomeStep">Step:</label>
                                <input
                                    id="initAmtIncomeStep"
                                    type="number"
                                    value={LC_initAmt_incomeParams?.step ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_incomeParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("initAmt_expense") && (
                    <div className="optionLine2">
                        <label>Expense Event: Initial Amount Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="initAmtExpenseObj">Event:</label>
                                <select
                                    id="initAmtExpenseObj"
                                    value={LC_initAmt_expenseParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setLCInitAmt_expenseParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.filter(event => event.eventType === "expense").map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="initAmtExpenseMin">Min:</label>
                                <input
                                    id="initAmtExpenseMin"
                                    type="number"
                                    value={LC_initAmt_expenseParams?.min ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_expenseParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtExpenseMax">Max:</label>
                                <input
                                    id="initAmtExpenseMax"
                                    type="number"
                                    value={LC_initAmt_expenseParams?.max ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_expenseParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="initAmtExpenseStep">Step:</label>
                                <input
                                    id="initAmtExpenseStep"
                                    type="number"
                                    value={LC_initAmt_expenseParams?.step ?? ""}
                                    onChange={(e) =>
                                        setLCInitAmt_expenseParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}

                {showLineCharts_1d && LCParamType.includes("assetPercent") && (
                    <div className="optionLine2">
                        <label>Asset Allocation Percent Parameters:</label>
                        <div>
                            <div>
                                <label htmlFor="assetPercentObj">Event:</label>
                                <select
                                    id="assetPercentObj"
                                    value={LC_assetPercentParams?.obj?._id || ""}
                                    onChange={(e) => {
                                        const selectedObj = scenarioEvents.find(event => event._id === e.target.value);
                                        setLCAssetPercentParams(prev => ({ ...prev, obj: selectedObj }));
                                    }}
                                >
                                    <option value="">Select</option>
                                    {scenarioEvents.filter(event =>
                                        event.eventType === "invest" &&
                                        (
                                            (event.assetAllocationType === "glidepath" && (event.initialAllocation.filter(val => val !== 0).length === 2)) ||
                                            (event.assetAllocationType !== "glidepath" && event.fixedAllocation.filter(val => val !== 0).length === 2)
                                        )
                                    ).map((event) => (
                                        <option key={event._id} value={event._id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="assetPercentMin">Min:</label>
                                <input
                                    id="assetPercentMin"
                                    type="number"
                                    value={LC_assetPercentParams?.min ?? ""}
                                    onChange={(e) =>
                                        setLCAssetPercentParams(prev => ({ ...prev, min: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="assetPercentMax">Max:</label>
                                <input
                                    id="assetPercentMax"
                                    type="number"
                                    value={LC_assetPercentParams?.max ?? ""}
                                    onChange={(e) =>
                                        setLCAssetPercentParams(prev => ({ ...prev, max: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor="assetPercentStep">Step:</label>
                                <input
                                    id="assetPercentStep"
                                    type="number"
                                    value={LC_assetPercentParams?.step ?? ""}
                                    onChange={(e) =>
                                        setLCAssetPercentParams(prev => ({ ...prev, step: parseFloat(e.target.value) }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}
 
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
                    {showSuccessChart || showShadedChart || showStackedBarChart ? (
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
                            {/* {!showSuccessChart && !showShadedChart && (
                                <pre style={{ fontSize: "0.9rem", overflowX: "scroll" }}>
                                    {JSON.stringify(successProbabilityData, null, 2)}
                                </pre>
                            )} */}
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

export default Simulation; 
