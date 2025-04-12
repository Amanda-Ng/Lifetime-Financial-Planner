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

        spendingStrat: [] /*list, should load discretionary expenses dynamically*/,
        withdrawStrat: [] /*list, should load investments dynamically*/,
        roth_conversion_strategy: "",
        rmd_strategy: [],
        inflation: "",
        pre_contribLimit: "",
        /*Roth conversion*/
        target_taxBrac: "" /*load dynamically withh scraped tax brackets */,
        has_rothOptimizer: "",
        roth_startYr: "",
        roth_endYr: "",
        after_contribLimit: "",
        //chosen investments and event for this scenario
        investmentList:  [],
        events: [],

        //fetched from db
        userInvestments: [],
        userEvents: [],
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setScenario((prev) => ({ ...prev, [name]: value }));
    };
 
    const handleAddInvestment = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedInvestment = scenario.userInvestments.find(inv => inv._id === selectedId);
        if (
            selectedInvestment &&
            !(scenario.investmentList || []).some(inv => inv._id === selectedId)
        ) {
            setScenario(prev => ({
                ...prev,
                investmentList: [...(prev.investmentList || []), selectedInvestment],
            }));
        } 
        e.target.value = "";
    };
    
    const handleRemoveInvestment = (id) => {
        setScenario(prev => ({
            ...prev,
            investmentList: prev.investmentList.filter(inv => inv._id !== id),
            withdrawStrat: (prev.withdrawStrat || []).filter(inv => inv._id !== id), // ensure withdrawStrat is an array
            roth_conversion_strategy: (prev.roth_conversion_strategy || []).filter(
                inv => inv._id !== id // ensure roth_conversion_strategy is an array
            ),
            rmd_strategy: (prev.rmd_strategy || []).filter(inv => inv._id !== id), // ensure rmd_strategy is an array
        }));
    };
    

    const handleAddEvent = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedEvent = scenario.userEvents.find(ev => ev._id === selectedId);
        if (
          selectedEvent &&
          !(scenario.events || []).some(ev => ev._id === selectedId)
        ) {
          setScenario(prev => ({
            ...prev,
            events: [...(prev.events || []), selectedEvent],
          }));
        } 
        e.target.value = "";
      };
      
    const handleRemoveEvent = (id) => {
    setScenario(prev => ({
        ...prev,
        events: prev.events.filter(ev => ev._id !== id),
        spendingStrat: prev.spendingStrat.filter(ev => ev._id !== id), // remove from strategy too
    }));
    };
      
    const handleAddSpendingStrat = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedEvent = scenario.events.find(ev => ev._id === selectedId && ev.isDiscretionary); 
        if (
            selectedEvent &&
            !(scenario.spendingStrat || []).some(ev => ev._id === selectedId)
        ) {
            setScenario(prev => ({
            ...prev,
            spendingStrat: [...(prev.spendingStrat || []), selectedEvent],
            }));
        } 
            e.target.value = "";
    };
      
    const handleRemoveSpendingStrat = (id) => {
        setScenario(prev => ({
            ...prev,
            spendingStrat: (prev.spendingStrat || []).filter(ev => ev._id !== id),
        }));
    };  

    const handleAddWithdrawStrat = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedInvestment = scenario.investmentList.find(inv => inv._id === selectedId); 
        if (
            selectedInvestment &&
            !(scenario.withdrawStrat || []).some(inv => inv._id === selectedId)
        ) {
            setScenario(prev => ({
                ...prev,
                withdrawStrat: [...(prev.withdrawStrat || []), selectedInvestment],
            }));
        }
    
        e.target.value = "";
    };
    
    const handleRemoveWithdrawStrat = (id) => {
        setScenario(prev => ({
            ...prev,
            withdrawStrat: (prev.withdrawStrat || []).filter(inv => inv._id !== id),
        }));
    };

    const handleAddRMDStrategy = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedInvestment = scenario.investmentList.find(
            inv => inv._id === selectedId && inv.tax_status === "pre-tax retirement"
        ); 
        if (
            selectedInvestment &&
            !((scenario.rmd_strategy || []).some(inv => inv._id === selectedId))
        ) {
            setScenario(prev => ({
                ...prev,
                rmd_strategy: [...(prev.rmd_strategy || []), selectedInvestment],
            }));
        } 
        e.target.value = "";
    };
    
    const handleRemoveRMDStrategy = (id) => {
        setScenario(prev => ({
            ...prev,
            rmd_strategy: prev.rmd_strategy.filter(inv => inv._id !== id),
        }));
    };

    const handleAddRothConversionStrategy = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return; 
        const selectedInvestment = scenario.investmentList.find(
            inv => inv._id === selectedId && inv.tax_status === "pre-tax retirement"
        ); 
        if (
            selectedInvestment &&
            !(scenario.roth_conversion_strategy || []).some(inv => inv._id === selectedId)
        ) {
            setScenario(prev => ({
                ...prev,
                roth_conversion_strategy: [
                    ...(prev.roth_conversion_strategy || []),
                    selectedInvestment
                ]
            }));
        } 
        e.target.value = "";
    };
    
    const handleRemoveRothConversionStrategy = (id) => {
        setScenario(prev => ({
            ...prev,
            roth_conversion_strategy: (prev.roth_conversion_strategy || []).filter(
                inv => inv._id !== id
            )
        }));
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
            console.log("getting investments: ")
            const invest_response = await axiosClient.get('/api/getUserInvestments', { 
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const invests = invest_response.data;
            console.log(invests)
            console.log("getting events: ")
            const event_response = await axiosClient.get('/api/getUserEvents', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const events = event_response.data; 
            console.log(events) 
            //!! also get tax brackets
            setScenario({
                userInvestments: invests,
                userEvents: events
            }); 
          } catch (err) {
            console.error('Failed to fetch user data:', err);
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
                <select name="investmentList" defaultValue="" onChange={handleAddInvestment} required>
                    <option value="" disabled>
                        Select Investments
                    </option>
                    {scenario.userInvestments.map((ele,index)=>
                            <option key={index} value={ele._id}>{ele.investmentType.name}: ${ele.value.$numberDecimal}</option>
                    )
                    } 
                </select>

                <ul > 
                    {(scenario.investmentList || []).map(inv => (
                    <li key={inv._id} onClick={() => handleRemoveInvestment(inv._id)} > 
                        {inv.investmentType.name}: ${inv.value.$numberDecimal}
                    </li>
                    ))}
                </ul>
            </div>

            {/*Event series*/}
            <div>
                <label>
                    Event Series<span className="required"> *</span>
                </label>
                <select name="events" defaultValue="" onChange={handleAddEvent} required >
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
                    {(scenario.events || []).map(event => (
                        <li key={event._id} onClick={() => handleRemoveEvent(event._id)}>
                            {event.name}
                        </li>
                    ))}
                </ul> 
            </div>

            {/*spending strategy: */}
            <div>
                <label>
                    Spending Strategy<span className="required"> *</span>
                </label>
                <select name="spendingStrat" defaultValue="" onChange={handleAddSpendingStrat} required>
                    <option value="" disabled>
                        Select a discretionary event
                    </option>
                    {(scenario.events || []).filter(event => event.isDiscretionary).map(event => (
                        <option key={event._id} value={event._id}>
                            {event.name}
                        </option>
                    ))} 
                </select> 
                <ul>
                    {(scenario.spendingStrat || []).map(event => (
                        <li key={event._id} onClick={() => handleRemoveSpendingStrat(event._id)} >
                            {event.name}
                        </li>
                    ))}
                </ul>
            </div>
            {/*withdrawal strategy*/}
            <div>
                <label>
                    Expense Withdrawal Strategy<span className="required"> *</span>
                </label>
                <select name="withdrawStrat" defaultValue="" onChange={handleAddWithdrawStrat} required>
                    <option value="" disabled>
                        Select an investment
                    </option>
                    {(scenario.investmentList || []).map(inv => (
                        <option key={inv._id} value={inv._id}>
                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
                        </option>
                    ))}
                </select> 

                <ul>
                    {(scenario.withdrawStrat || []).map(inv => (
                        <li key={inv._id} onClick={() => handleRemoveWithdrawStrat(inv._id)}>
                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
                        </li>
                    ))}
                </ul>
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
                                <select name="roth_conversion_strategy" defaultValue="" onChange={handleAddRothConversionStrategy} required>
                                    <option value="" disabled>Select a pre-tax investment</option>
                                    {(scenario.investmentList || []).filter(inv => inv.tax_status === "pre-tax retirement").map(inv => (
                                        <option key={inv._id} value={inv._id}>
                                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
                                        </option>
                                    ))}
                                </select>

                                <ul>
                                    {(scenario.roth_conversion_strategy || []).map(inv => (
                                        <li key={inv._id} onClick={() => handleRemoveRothConversionStrategy(inv._id)}>
                                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
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
                <select name="rmd_strategy" defaultValue="" onChange={handleAddRMDStrategy} required>
                    <option value="" disabled>Select a pre-tax investment</option>
                    {(scenario.investmentList || []).filter(inv => inv.tax_status === "pre-tax retirement").map(inv => (
                        <option key={inv._id} value={inv._id}>
                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
                        </option>
                    ))}
                </select>

                <ul>  
                    {(scenario.rmd_strategy || []).map(inv => (
                        <li key={inv._id} onClick={() => handleRemoveRMDStrategy(inv._id)}>
                            {inv.investmentType.name}: ${inv.value.$numberDecimal}
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
            <button type="submit" disabled={isViewing}>Save Scenario</button>
            <button type="button" onClick={handleCancel}>
                Cancel
            </button>
        </form>
    );
}

export default ScenarioForm;
