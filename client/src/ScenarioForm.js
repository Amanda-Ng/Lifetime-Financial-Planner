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
        maritialStatus: "single",
        birthYear_spouse: "",
        lifeExpectancy_opt_spouse: "fixed",
        lifeExpectancy_value_spouse: "",
        life_expectancy_mean_spouse: "",
        life_expectancy_stdv_spouse: "",

        spendingStrat: "" /*list, should load discretionary expenses dynamically*/,
        withdrawStrat: "" /*list, should load investments dynamically*/,
        roth_conversion_strategy: "",
        rmd_strategy: "",
        inflation: "",
        pre_contribLimit: "",
        /*Roth conversion*/
        target_taxBrac: "" /*load dynamically withh scraped tax brackets */,
        has_rothOptimizer: "",
        roth_startYr: "",
        roth_endYr: "",
        after_contribLimit: "",
        //chosen investments and event for this scenario
        investmentList: "",
        events: "",

        //fetched from db
        userInvestments: [],
        userEvents: [],
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setScenario((prev) => ({ ...prev, [name]: value }));
    };
    const handleCancel = () => {
        navigate("/scenario"); // Redirect to homepage when canceled
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("submitting scenario js");

        const readOnlyList = scenario.read_only
            .split(",")
            .map(email => email.trim())
            .filter(email => email); // Remove empty strings

        const readWriteList = scenario.read_write
            .split(",")
            .map(email => email.trim())
            .filter(email => email);

        const scenarioPayload = {
            ...scenario,
            read_only: readOnlyList,
            read_write: readWriteList
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
                // const invest_response = await fetch('http://localhost:3000/getInvestments');
                // const invests = await invest_response.json();
                // const event_response = await fetch('http://localhost:3000/getEvents');
                // const events = await event_response.json();
                //!! also get tax brackets
                // setScenario({
                //     userInvestments: invests,
                //     userEvents: events
                // });
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isEditing && scenarioObject) {
            setScenario(prev => ({
                ...prev,
                read_only: (scenarioObject.read_only || []).join(", "),
                read_write: (scenarioObject.read_write || []).join(", "),
                name: scenarioObject.name || "",
                birthYear: scenarioObject.birth_year || "",
                birthYear_spouse: scenarioObject.birth_year_spouse || "",
                financialGoal: scenarioObject.financial_goal?.$numberDecimal || "",
                stateResidence: scenarioObject.state_of_residence || "",
                maritialStatus: scenarioObject.marital_status || "single",
                lifeExpectancy_value: scenarioObject.life_expectancy || "",
                life_expectancy_mean: scenarioObject.life_expectancy_mean || "",
                life_expectancy_stdv: scenarioObject.life_expectancy_stdv || "",
                lifeExpectancy_value_spouse: scenarioObject.life_expectancy_spouse || "",
                roth_conversion_strategy: scenarioObject.roth_conversion_strategy?.[0] || "",
                rmd_strategy: scenarioObject.rmd_strategy?.[0] || "",
                spendingStrat: scenarioObject.spending_strategy?.[0] || "",
                withdrawStrat: scenarioObject.expense_withdrawal_strategy?.[0] || "",
                inflation: scenarioObject.inflation_assumption || "",
                pre_contribLimit: scenarioObject.init_limit_pretax?.$numberDecimal || "",
                after_contribLimit: scenarioObject.init_limit_aftertax?.$numberDecimal || "",
                investmentList: scenarioObject.investments?.[0] || "",
                events: scenarioObject.event_series?.[0] || "",
            }));
        }
    }, [isEditing, scenarioObject]);

    return (
        <form id="scenario-form" onSubmit={handleSubmit}>
            <h2>Scenario Form</h2>
            {/* Sharing - Read-only */}
            <div>
                <label>
                    Share with (Read-Only)
                </label>
                <input
                    type="text"
                    name="read_only"
                    placeholder="email1@example.com, email2@example.com"
                    value={scenario.read_only}
                    onChange={handleChange}
                />
            </div>
            {/* Sharing - Read-Write */}
            <div>
                <label>
                    Share with (Read-Write)
                </label>
                <input
                    type="text"
                    name="read_write"
                    placeholder="email3@example.com, email4@example.com"
                    value={scenario.read_write}
                    onChange={handleChange}
                />
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
            {/*maritialStatus: */}
            <div>
                <label>
                    Maritial Status <span className="required">*</span>
                </label>
                <select name="maritialStatus" value={scenario.maritialStatus} onChange={handleChange} required>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                </select>
            </div>

            {scenario.maritialStatus === "married" && (
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
                <label>
                    Investments<span className="required"> *</span>
                </label>
                <select name="investmentList" value={scenario.investmentList} onChange={handleChange} required>
                    <option value="investmentName">investment 1</option>
                    {/*!!load options dynamically from user investments*/}
                </select>
            </div>

            {/*Event series*/}
            <div>
                <label>
                    Event Series<span className="required"> *</span>
                </label>
                <select name="events" value={scenario.events} onChange={handleChange} required>
                    <option value="eventName">event 1</option>
                    {/*!!load options dynamically from user events*/}
                </select>
            </div>

            {/*spending strategy: */}
            <div>
                <label>
                    Spending Strategy<span className="required"> *</span>
                </label>
                <select name="spendingStrat" value={scenario.spendingStrat} onChange={handleChange} required>
                    <option value="investmentName">investment 1</option>
                </select>
                {/*!!load options dynamically from chosen investments*/}
            </div>
            {/*withdrawal strategy*/}
            <div>
                <label>
                    Expense Withdrawal Strategy<span className="required"> *</span>
                </label>
                <select name="withdrawStrat" value={scenario.withdrawStrat} onChange={handleChange} required>
                    <option value="eventName">event 1</option>
                </select>
                {/*!!load options dynamically from chosen events*/}
            </div>
            {/*inflation: */}
            <div>
                <label>
                    Inflation<span className="required"> *</span>
                </label>
                <input type="number" name="inflation" value={scenario.inflation} onChange={handleChange} placeholder="%" required />
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
                                <label>
                                    Target Tax Bracket<span className="required"> *</span>
                                </label>
                                <select name="target_taxBrac" value={scenario.investmentList} onChange={handleChange} required>
                                    <option value="index#">bracket 1</option>
                                    {/*!!load options dynamically from db data*/}
                                </select>
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">Start Year</label>
                                <input type="number" name="roth_startYr" value={scenario.roth_startYr} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">End Year</label>
                                <input type="number" name="roth_endYr" value={scenario.roth_endYr} onChange={handleChange} required />
                            </div>
                            <div className="radioOpt">
                                <label className="radioInput">Roth Conversion Strategy</label>
                                <select name="roth_conversion_strategy" value={scenario.roth_conversion_strategy} onChange={handleChange} required>
                                    <option value="investmentName">investment 1</option>
                                </select>
                                {/*!!load options dynamically from chosen investments*/}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/*rmd_strategy */}
            <div>
                <label>RMD Strategy</label>
                <select name="rmd_strategy " value={scenario.rmd_strategy} onChange={handleChange} required>
                    <option value="investmentID">investment 1</option>
                </select>
                {/*!!load options dynamically from chosen investments that're pre-tax retirement acc*/}
            </div>

            {/*after-tax retirement account contribution limit*/}
            <div>
                <label>
                    After-tax retirement account contribution limit<span className="required"> *</span>
                </label>
                <input type="number" name="after_contribLimit" value={scenario.after_contribLimit} onChange={handleChange} required />
            </div>

            {/* Buttons */}
            <button type="submit" disabled={isViewing}>Save Scenario</button>
            <button type="button" onClick={handleCancel}>
                Cancel
            </button>
        </form>
    );
}

export default ScenarioForm;
