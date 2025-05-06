import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosClient } from "./services/apiClient";
import "./App.css";
import "./ScenarioForm.css";

function ScenarioForm() {
    const location = useLocation();
    const { scenarioObject, isEditing, isViewing } = location.state || {};

    const navigate = useNavigate();
    const [scenario, setScenario] = useState({
        read_only: "",
        read_write: "",
        name: "",
        birthYear: "",
        lifeExpectancy_opt: "fixed",
        lifeExpectancy_value: "",
        life_expectancy_mean: "",
        life_expectancy_stdv: "",
        financialGoal: "",
        stateResidence: "",
        maritalStatus: "single",
        birthYear_spouse: "",
        lifeExpectancy_opt_spouse: "fixed",
        lifeExpectancy_value_spouse: "",
        life_expectancy_mean_spouse: "",
        life_expectancy_stdv_spouse: "",

        spendingStrat: [] /*list, should load discretionary expenses dynamically*/,
        withdrawStrat: [] /*list, should load investments dynamically*/,
        roth_conversion_strategy: [],
        rmd_strategy: [],
        pre_contribLimit: "",
        //inflation
        infl_type: "fixed", //fixed, normal, uniform
        infl_value: "",
        infl_mean: "",
        infl_stdev: "",
        infl_min: "",
        infl_max: "",

        /*Roth conversion*/
        target_taxBrac: 0 /*load dynamically withh scraped tax brackets */,
        has_rothOptimizer: "",
        roth_startYr: "",
        roth_endYr: "",
        after_contribLimit: "",
        //chosen investments and event for this scenario
        investmentList: [],
        events: [],

        //fetched from db
        tax_Brack: null,
        userInvestments: [],
        userEvents: [],
    });

    //update tax brackets based on state
    useEffect(() => {
        if (scenario.stateResidence) {
            axiosClient
                .get(`/api/tax-brackets?stateResidence=${scenario.stateResidence}&year=${scenario.roth_startYr}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })
                .then((response) => {
                    const brackets = response.data;
                    setScenario((prev) => ({
                        ...prev,
                        tax_Brack: brackets, // Update with fetched brackets or no-brackets
                    }));
                    console.log("tax_Brack: " + brackets);
                })
                .catch((error) => {
                    if (error.response && error.response.status === 404) {
                        // No brackets found for state and year
                        setScenario((prev) => ({
                            ...prev,
                            tax_Brack: null,
                        }));
                        console.log("404 tax_Brack: ");
                    } else {
                        // Other errors
                        console.error("Error fetching tax brackets:", error);
                        setScenario((prev) => ({
                            ...prev,
                            tax_Brack: ["Error"], // You can handle/display this as needed
                        }));
                    }
                });
        }
    }, [scenario.stateResidence, scenario.roth_startYr]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setScenario((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddInvestment = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedInvestment = scenario.userInvestments.find((inv) => inv._id === selectedId);
        if (selectedInvestment && !(scenario.investmentList || []).some((inv) => inv._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                investmentList: [...(prev.investmentList || []), selectedInvestment],
            }));
        }
        e.target.value = "";
    };

    const handleRemoveInvestment = (id) => {
        setScenario((prev) => ({
            ...prev,
            investmentList: prev.investmentList.filter((inv) => inv._id !== id),
            withdrawStrat: (prev.withdrawStrat || []).filter((inv) => inv._id !== id), // ensure withdrawStrat is an array
            roth_conversion_strategy: (prev.roth_conversion_strategy || []).filter(
                (inv) => inv._id !== id // ensure roth_conversion_strategy is an array
            ),
            rmd_strategy: (prev.rmd_strategy || []).filter((inv) => inv._id !== id), // ensure rmd_strategy is an array
        }));
    };

    const handleAddEvent = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedEvent = scenario.userEvents.find((ev) => ev._id === selectedId);
        if (selectedEvent && !(scenario.events || []).some((ev) => ev._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                events: [...(prev.events || []), selectedEvent],
            }));
        }
        e.target.value = "";
    };

    const handleRemoveEvent = (id) => {
        setScenario((prev) => ({
            ...prev,
            events: prev.events.filter((ev) => ev._id !== id),
            spendingStrat: prev.spendingStrat.filter((ev) => ev._id !== id), // remove from strategy too
        }));
    };

    const handleAddSpendingStrat = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedEvent = scenario.events.find((ev) => ev._id === selectedId && ev.isDiscretionary);
        if (selectedEvent && !(scenario.spendingStrat || []).some((ev) => ev._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                spendingStrat: [...(prev.spendingStrat || []), selectedEvent],
            }));
        }
        e.target.value = "";
    };

    const handleRemoveSpendingStrat = (id) => {
        setScenario((prev) => ({
            ...prev,
            spendingStrat: (prev.spendingStrat || []).filter((ev) => ev._id !== id),
        }));
    };

    const handleAddWithdrawStrat = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedInvestment = scenario.investmentList.find((inv) => inv._id === selectedId);
        if (selectedInvestment && !(scenario.withdrawStrat || []).some((inv) => inv._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                withdrawStrat: [...(prev.withdrawStrat || []), selectedInvestment],
            }));
        }

        e.target.value = "";
    };

    const handleRemoveWithdrawStrat = (id) => {
        setScenario((prev) => ({
            ...prev,
            withdrawStrat: (prev.withdrawStrat || []).filter((inv) => inv._id !== id),
        }));
    };

    const handleAddRMDStrategy = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedInvestment = scenario.investmentList.find((inv) => inv._id === selectedId && inv.tax_status === "pre-tax retirement");
        if (selectedInvestment && !(scenario.rmd_strategy || []).some((inv) => inv._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                rmd_strategy: [...(prev.rmd_strategy || []), selectedInvestment],
            }));
        }
        e.target.value = "";
    };

    const handleRemoveRMDStrategy = (id) => {
        setScenario((prev) => ({
            ...prev,
            rmd_strategy: prev.rmd_strategy.filter((inv) => inv._id !== id),
        }));
    };

    const handleAddRothConversionStrategy = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const selectedInvestment = scenario.investmentList.find((inv) => inv._id === selectedId && inv.tax_status === "pre-tax retirement");
        if (selectedInvestment && !(scenario.roth_conversion_strategy || []).some((inv) => inv._id === selectedId)) {
            setScenario((prev) => ({
                ...prev,
                roth_conversion_strategy: [...(prev.roth_conversion_strategy || []), selectedInvestment],
            }));
        }
        e.target.value = "";
    };

    const handleRemoveRothConversionStrategy = (id) => {
        setScenario((prev) => ({
            ...prev,
            roth_conversion_strategy: (prev.roth_conversion_strategy || []).filter((inv) => inv._id !== id),
        }));
    };

    const handleCancel = () => {
        navigate("/scenario"); // Redirect to homepage when canceled
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const readOnlyList = (scenario.read_only || "")
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email); // Remove empty strings

        const readWriteList = (scenario.read_write || "")
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email);

        const scenarioPayload = {
            ...scenario,
            read_only: readOnlyList,
            read_write: readWriteList,
        };

        try {
            if (isEditing && scenarioObject?._id) {
                await axiosClient.put(`/api/scenarioForm/${scenarioObject._id}`, scenarioPayload);
                alert("Scenario updated successfully!");
            } else {
                await axiosClient.post("/api/scenarioForm", scenarioPayload);
                alert("Scenario added successfully!");
            }

            navigate("/scenario");
        } catch (error) {
            alert("Error submitting the form.");
            console.error("Error submitting form:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const invest_response = await axiosClient.get("/api/getUserInvestments", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const invests = invest_response.data;

                const event_response = await axiosClient.get("/api/getUserEvents", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const events = event_response.data;
                //!! also get tax brackets
                setScenario((prev) => ({
                    ...prev,
                    userInvestments: invests,
                    userEvents: events,
                }));
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (scenarioObject) {
            const investmentList = (scenarioObject.investments || []).map((id) => scenario.userInvestments.find((inv) => inv._id === id)).filter(Boolean);

            const events = (scenarioObject.event_series || []).map((id) => scenario.userEvents.find((evt) => evt._id === id)).filter(Boolean);

            const withdrawStrat = (scenarioObject.expense_withdrawal_strategy || []).map((id) => investmentList.find((inv) => inv._id === id)).filter(Boolean);

            const spendingStrat = (scenarioObject.spending_strategy || []).map((id) => events.find((evt) => evt._id === id)).filter(Boolean);

            const rmdStrat = (scenarioObject.rmd_strategy || []).map((id) => investmentList.find((inv) => inv._id === id)).filter(Boolean);

            const rothStrat = (scenarioObject.roth_conversion_strategy || []).map((id) => investmentList.find((inv) => inv._id === id)).filter(Boolean);

            setScenario((prev) => ({
                ...prev,
                read_only: (scenarioObject.read_only || []).join(", "),
                read_write: (scenarioObject.read_write || []).join(", "),
                name: scenarioObject.name || "",
                birthYear: scenarioObject.birth_year || "",
                birthYear_spouse: scenarioObject.birth_year_spouse || "",
                financialGoal: scenarioObject.financial_goal ?? "",
                stateResidence: scenarioObject.state_of_residence || "",
                maritalStatus: scenarioObject.marital_status || "single",
                lifeExpectancy_value: scenarioObject.life_expectancy || "",
                life_expectancy_mean: scenarioObject.life_expectancy_mean || "",
                life_expectancy_stdv: scenarioObject.life_expectancy_stdv || "",
                lifeExpectancy_value_spouse: scenarioObject.life_expectancy_spouse || "",
                life_expectancy_mean_spouse: scenarioObject.life_expectancy_mean_spouse || "",
                life_expectancy_stdv_spouse: scenarioObject.life_expectancy_stdv_spouse || "",
                rothStrat,
                rmdStrat,
                spendingStrat,
                withdrawStrat,
                infl_type: scenarioObject.infl_type,
                infl_value: scenarioObject.infl_value ?? "",
                infl_mean: scenarioObject.infl_mean ?? "",
                infl_stdev: scenarioObject.infl_stdev ?? "",
                infl_min: scenarioObject.infl_min ?? "",
                infl_max: scenarioObject.infl_max ?? "",
                pre_contribLimit: scenarioObject.init_limit_pretax ?? "",
                after_contribLimit: scenarioObject.init_limit_aftertax ?? "",
                investmentList,
                events,
            }));
        }
    }, [isEditing, scenarioObject, scenario.userInvestments, scenario.userEvents]);

    return (
        <form id="scenario-form" onSubmit={handleSubmit}>
            <h2>Scenario Form</h2>
            {/* Sharing - Read-only */}
            <div>
                <label>Share with (Read-Only)</label>
                <input type="text" name="read_only" placeholder="email1@example.com, email2@example.com" value={scenario.read_only} onChange={handleChange} />
            </div>
            {/* Sharing - Read-Write */}
            <div>
                <label>Share with (Read-Write)</label>
                <input type="text" name="read_write" placeholder="email3@example.com, email4@example.com" value={scenario.read_write} onChange={handleChange} />
            </div>
            {/* Name */}
            <div>
                <label>
                    Scenario Name <span className="required">*</span>
                </label>
                <input type="text" name="name" value={scenario.name} onChange={handleChange} required />
            </div>
            {/*birthYear*/}
            <div>
                <label>
                    Your Birth Year<span className="required">*</span>
                </label>
                <input type="number" name="birthYear" value={scenario.birthYear} onChange={handleChange} required />
            </div>
            {/*life expectancy*/}
            <div>
                <label>
                    Your Life Expectancy<span className="required"> *</span>
                </label>
                <div className="radio-group2">
                    {/*opt: fixed*/}
                    <div className="radioOpt">
                        <label>
                            <input
                                className="radioInput"
                                type="radio"
                                name="lifeExpectancy_opt"
                                value="fixed"
                                checked={scenario.lifeExpectancy_opt === "fixed"}
                                onChange={handleChange}
                            />
                            Fixed Value
                        </label>
                        {scenario.lifeExpectancy_opt === "fixed" && (
                            <>
                                <input type="number" name="lifeExpectancy_value" value={scenario.lifeExpectancy_value} onChange={handleChange} required />
                            </>
                        )}
                    </div>
                    {/*opt: normDistri*/}
                    <label className="radioInput">
                        <input
                            type="radio"
                            name="lifeExpectancy_opt"
                            value="normDistri"
                            checked={scenario.lifeExpectancy_opt === "normDistri"}
                            onChange={handleChange}
                        />
                        Sample from normal distribution
                    </label>
                    {scenario.lifeExpectancy_opt === "normDistri" && (
                        <>
                            <div className="radioOpt">
                                <label className="radioInput">Mean</label>
                                <input type="number" name="life_expectancy_mean" value={scenario.life_expectancy_mean} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">Standard Deviation</label>
                                <input type="number" name="life_expectancy_stdv" value={scenario.life_expectancy_stdv} onChange={handleChange} required />
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/*financialGoal: */}
            <div>
                <label>
                    Financial Goal<span className="required">*</span>
                </label>
                <input type="number" name="financialGoal" value={scenario.financialGoal} onChange={handleChange} required />
            </div>
            {/*state of residence: */}
            <div>
                <label>
                    State of Residence <span className="required">*</span>
                </label>
                <input type="text" name="stateResidence" value={scenario.stateResidence} onChange={handleChange} required />
            </div>
            {/*maritalStatus: */}
            <div>
                <label>
                    Maritial Status <span className="required">*</span>
                </label>
                <select name="maritalStatus" value={scenario.maritalStatus} onChange={handleChange} required>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                </select>
            </div>

            {scenario.maritalStatus === "married" && (
                <>
                    {/*spouse birthYear*/}
                    <div>
                        <label>
                            Spouse Birth Year<span className="required">*</span>
                        </label>
                        <input type="number" name="birthYear_spouse" value={scenario.birthYear_spouse} onChange={handleChange} required />
                    </div>
                    {/*spouse life expectancy*/}
                    <div>
                        <label>
                            Spouse Life Expectancy<span className="required">*</span>
                        </label>
                        <div className="radio-group2">
                            {/*opt: fixed*/}
                            <div className="radioOpt">
                                <label>
                                    <input
                                        className="radioInput"
                                        type="radio"
                                        name="lifeExpectancy_opt_spouse"
                                        value="fixed"
                                        checked={scenario.lifeExpectancy_opt_spouse === "fixed"}
                                        onChange={handleChange}
                                    />
                                    Fixed Value
                                </label>
                                {scenario.lifeExpectancy_opt_spouse === "fixed" && (
                                    <>
                                        <input
                                            type="number"
                                            name="lifeExpectancy_value_spouse"
                                            value={scenario.lifeExpectancy_value_spouse}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>
                            {/*opt: normDistri*/}
                            <label className="radioInput">
                                <input
                                    type="radio"
                                    name="lifeExpectancy_opt_spouse"
                                    value="normDistri"
                                    checked={scenario.lifeExpectancy_opt_spouse === "normDistri"}
                                    onChange={handleChange}
                                />
                                Sample from normal distribution
                            </label>
                            {scenario.lifeExpectancy_opt_spouse === "normDistri" && (
                                <>
                                    <div className="radioOpt">
                                        <label className="radioInput">Mean</label>
                                        <input
                                            type="number"
                                            name="life_expectancy_mean_spouse"
                                            value={scenario.life_expectancy_mean_spouse}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="radioOpt">
                                        <label className="radioInput">Standard Deviation</label>
                                        <input
                                            type="number"
                                            name="life_expectancy_stdv_spouse"
                                            value={scenario.life_expectancy_stdv_spouse}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/*Investments*/}
            <div>
                <label>Investments</label>
                <select name="investmentList" defaultValue="" onChange={handleAddInvestment}>
                    <option value="" disabled>
                        Select Investments
                    </option>
                    {scenario.userInvestments.map((ele, index) => (
                        <option key={index} value={ele._id}>
                            {ele.investmentType.name}: ${ele.value}
                        </option>
                    ))}
                </select>

                <ul>
                    {(scenario.investmentList || []).map((inv) => (
                        <li key={inv._id} onClick={() => handleRemoveInvestment(inv._id)}>
                            {inv.investmentType.name}: ${inv.value}
                        </li>
                    ))}
                </ul>
            </div>

            {/*Event series*/}
            <div>
                <label>Event Series</label>
                <select name="events" defaultValue="" onChange={handleAddEvent}>
                    <option value="" disabled>
                        Select events
                    </option>
                    {scenario.userEvents.map((event, index) => (
                        <option key={index} value={event._id}>
                            {event.name}
                        </option>
                    ))}
                </select>
                <ul>
                    {(scenario.events || []).map((event) => (
                        <li key={event._id} onClick={() => handleRemoveEvent(event._id)}>
                            {event.name}
                        </li>
                    ))}
                </ul>
            </div>

            {/*spending strategy: */}
            <div>
                <label>Spending Strategy</label>
                <select name="spendingStrat" defaultValue="" onChange={handleAddSpendingStrat}>
                    <option value="" disabled>
                        Select a discretionary expense
                    </option>
                    {(scenario.events || [])
                        .filter((event) => event.isDiscretionary)
                        .map((event) => (
                            <option key={event._id} value={event._id}>
                                {event.name}
                            </option>
                        ))}
                </select>
                <ul>
                    {(scenario.spendingStrat || []).map((event) => (
                        <li key={event._id} onClick={() => handleRemoveSpendingStrat(event._id)}>
                            {event.name}
                        </li>
                    ))}
                </ul>
            </div>
            {/*withdrawal strategy*/}
            <div>
                <label>Expense Withdrawal Strategy</label>
                <select name="withdrawStrat" defaultValue="" onChange={handleAddWithdrawStrat}>
                    <option value="" disabled>
                        Select an investment
                    </option>
                    {(scenario.investmentList || []).map((inv) => (
                        <option key={inv._id} value={inv._id}>
                            {inv.investmentType.name}: ${inv.value}
                        </option>
                    ))}
                </select>

                <ul>
                    {(scenario.withdrawStrat || []).map((inv) => (
                        <li key={inv._id} onClick={() => handleRemoveWithdrawStrat(inv._id)}>
                            {inv.investmentType.name}: ${inv.value}
                        </li>
                    ))}
                </ul>
            </div>
            {/*inflation: */}
            <div>
                <label>
                    Inflation<span className="required"> *</span>
                </label>
                <div className="radio-group2">
                    {/*opt: fixed*/}
                    <div className="radioOpt">
                        <label>
                            <input
                                className="radioInput"
                                type="radio"
                                name="infl_type"
                                value="fixed"
                                checked={scenario.infl_type === "fixed"}
                                onChange={handleChange}
                            />
                            Fixed Value
                        </label>
                        {scenario.infl_type === "fixed" && (
                            <>
                                <input type="number" name="infl_value" value={scenario.infl_value} onChange={handleChange} required />
                            </>
                        )}
                    </div>
                    {/*opt: normal distribution*/}
                    <label className="radioInput">
                        <input type="radio" name="infl_type" value="normal" checked={scenario.infl_type === "normal"} onChange={handleChange} />
                        Sample from normal distribution
                    </label>
                    {scenario.infl_type === "normal" && (
                        <>
                            <div className="radioOpt">
                                <label className="radioInput">Mean</label>
                                <input type="number" name="infl_mean" value={scenario.infl_mean} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">Standard Deviation</label>
                                <input type="number" name="infl_stdev" value={scenario.infl_stdev} onChange={handleChange} required />
                            </div>
                        </>
                    )}
                    {/*opt: uniform*/}
                    <label className="radioInput">
                        <input type="radio" name="infl_type" value="uniform" checked={scenario.infl_type === "uniform"} onChange={handleChange} />
                        Sample from uniform distribution
                    </label>
                    {scenario.infl_type === "uniform" && (
                        <>
                            <div className="radioOpt">
                                <label className="radioInput">Min</label>
                                <input type="number" name="infl_min" value={scenario.infl_min} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">Max</label>
                                <input type="number" name="infl_max" value={scenario.infl_max} onChange={handleChange} required />
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/*pre-tax retirement account contribution limit*/}
            <div>
                <label>
                    Pre-tax retirement account contribution limit<span className="required"> *</span>
                </label>
                <input type="number" name="pre_contribLimit" value={scenario.pre_contribLimit} onChange={handleChange} required />
            </div>

            {/*enable roth conversion optimizer*/}
            <div>
                <label>Roth conversion optimizer</label>
                <div>
                    {/*opt: disable*/}
                    <label className="radioInput">
                        <input type="radio" name="has_rothOptimizer" value="None" checked={scenario.has_rothOptimizer === "None"} onChange={handleChange} />
                        None
                    </label>
                    <label className="radioInput">
                        <input
                            type="radio"
                            name="has_rothOptimizer"
                            value="rothOptimizer_on"
                            checked={scenario.has_rothOptimizer === "rothOptimizer_on"}
                            onChange={handleChange}
                        />
                        Enable
                    </label>
                    {/*roth conversion*/}
                    {scenario.has_rothOptimizer === "rothOptimizer_on" && (
                        <>
                            <div className="radioOpt">
                                <label className="radioInput">Start Year</label>
                                <input type="number" name="roth_startYr" value={scenario.roth_startYr} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">End Year</label>
                                <input type="number" name="roth_endYr" value={scenario.roth_endYr} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label>
                                    Target Tax Bracket<span className="required"> *</span>
                                </label>
                                <select name="target_taxBrac" value={scenario.target_taxBrac} onChange={handleChange} required>
                                    {scenario.tax_Brack === null && <option disabled>No data found for state and start year</option>}
                                    {/*single tax brackets*/}
                                    {scenario.tax_Brack != null &&
                                        scenario.maritalStatus === "single" &&
                                        scenario.tax_Brack.single_tax_brackets.map((bracket, index) => (
                                            <option key={index} value={index}>
                                                {bracket.range[1] === "Infinity"
                                                    ? `$${bracket.range[0]} and up`
                                                    : `$${bracket.range[0]} - $${bracket.range[1]}`}
                                            </option>
                                        ))}
                                    {/*married tax brackets*/}
                                    {scenario.tax_Brack != null &&
                                        scenario.maritalStatus === "married" &&
                                        scenario.tax_Brack.married_tax_brackets.map((bracket, index) => (
                                            <option key={index} value={index}>
                                                {bracket.range[1] === "Infinity"
                                                    ? `$${bracket.range[0]} and up`
                                                    : `$${bracket.range[0]} - $${bracket.range[1]}`}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="radioOpt">
                                <label className="radioInput">Roth Conversion Strategy</label>
                                <select name="roth_conversion_strategy" defaultValue="" onChange={handleAddRothConversionStrategy}>
                                    <option value="" disabled>
                                        Select a pre-tax investment
                                    </option>
                                    {(scenario.investmentList || [])
                                        .filter((inv) => inv.tax_status === "pre-tax retirement")
                                        .map((inv) => (
                                            <option key={inv._id} value={inv._id}>
                                                {inv.investmentType.name}: ${inv.value}
                                            </option>
                                        ))}
                                </select>

                                <ul>
                                    {(scenario.roth_conversion_strategy || []).map((inv) => (
                                        <li key={inv._id} onClick={() => handleRemoveRothConversionStrategy(inv._id)}>
                                            {inv.investmentType.name}: ${inv.value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/*rmd_strategy */}
            <div>
                <label>RMD Strategy</label>
                <select name="rmd_strategy" defaultValue="" onChange={handleAddRMDStrategy}>
                    <option value="" disabled>
                        Select a pre-tax investment
                    </option>
                    {(scenario.investmentList || [])
                        .filter((inv) => inv.tax_status === "pre-tax retirement")
                        .map((inv) => (
                            <option key={inv._id} value={inv._id}>
                                {inv.investmentType.name}: ${inv.value}
                            </option>
                        ))}
                </select>

                <ul>
                    {(scenario.rmd_strategy || []).map((inv) => (
                        <li key={inv._id} onClick={() => handleRemoveRMDStrategy(inv._id)}>
                            {inv.investmentType.name}: ${inv.value}
                        </li>
                    ))}
                </ul>
            </div>

            {/*after-tax retirement account contribution limit*/}
            <div>
                <label>
                    After-tax retirement account contribution limit<span className="required"> *</span>
                </label>
                <input type="number" name="after_contribLimit" value={scenario.after_contribLimit} onChange={handleChange} required />
            </div>

            {/* Buttons */}
            <button type="submit" disabled={isViewing}>
                Save Scenario
            </button>
            <button type="button" onClick={handleCancel}>
                Cancel
            </button>
        </form>
    );
}

export default ScenarioForm;
