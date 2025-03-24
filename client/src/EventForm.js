import React, { useState, useEffect } from "react";
import { axiosClient } from "./services/apiClient";

const EventForm = () => {
    const [event, setEvent] = useState({
        name: "",
        description: "",
        startYearType: "fixed", // default to fixed
        startYear: "",
        meanStartYear: "",
        stdDevStartYear: "",
        minStartYear: "",
        maxStartYear: "",
        anotherEventSeries: "",
        durationType: "fixed", // default to fixed
        duration: "",
        meanDuration: "",
        stdDevDuration: "",
        minDuration: "",
        maxDuration: "",
        eventType: "income", // default to income
        initialAmount: "",
        expectedChangeType: "fixed", // default to fixed
        expectedChange: "",
        expectedChangeAmount: "",
        expectedChangePercentage: "",
        meanChange: "",
        stdDevChange: "",
        minChange: "",
        maxChange: "",
        inflationAdjustment: false,
        isMarried: false,
        userPercentage: "",
        isSocialSecurity: false,
        isDiscretionary: false,
        assetAllocationType: "",
        maxCash: "",
        fixedAllocation: [], // Array to store fixed percentages
        initialAllocation: [], // Array for initial percentages (glide path)
        finalAllocation: [], // Array for final percentages (glide path)
    });

    const [investments, setInvestments] = useState([]); // All available investments
    const [eventSeries, setEventSeries] = useState([]); // All available event series

    useEffect(() => {
        const fetchData = async () => {
            try {
                const investmentsResponse = await axiosClient.get("/api/investments");
                setInvestments(investmentsResponse.data);

                const eventSeriesResponse = await axiosClient.get("/api/event-series");
                setEventSeries(eventSeriesResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEvent((prevState) => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRadioChange = (e) => {
        const { name, value } = e.target;
        setEvent((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleAllocationChange = (e, index) => {
        const { value } = e.target;
        const newAllocation = [...event.fixedAllocation];

        // Ensure the value is a valid number
        newAllocation[index] = parseFloat(value) || 0;

        // Update the event state with the new fixed allocation
        setEvent((prevState) => ({
            ...prevState,
            fixedAllocation: newAllocation
        }));
    };

    const handleGlidePathChange = (e, index, type) => {
        const { value } = e.target;
        let updatedAllocations;

        if (type === "initial") {
            updatedAllocations = [...event.initialAllocation];
            updatedAllocations[index] = parseFloat(value) || 0; // Parse to float, fallback to 0 if invalid input
        } else if (type === "final") {
            updatedAllocations = [...event.finalAllocation];
            updatedAllocations[index] = parseFloat(value) || 0;
        }

        // Update the event state with the new allocation
        setEvent((prevState) => ({
            ...prevState,
            [type === "initial" ? "initialAllocation" : "finalAllocation"]: updatedAllocations
        }));
    };

    const handleCancel = () => {
        // Clear form when canceled
        setEvent({
            name: "",
            description: "",
            startYearType: "fixed", // default to fixed
            startYear: "",
            meanStartYear: "",
            stdDevStartYear: "",
            minStartYear: "",
            maxStartYear: "",
            anotherEventSeries: "",
            durationType: "fixed", // default to fixed
            duration: "",
            meanDuration: "",
            stdDevDuration: "",
            minDuration: "",
            maxDuration: "",
            eventType: "income", // default to income
            initialAmount: "",
            expectedChangeType: "fixed", // default to fixed
            expectedChange: "",
            expectedChangeAmount: "",
            expectedChangePercentage: "",
            meanChange: "",
            stdDevChange: "",
            minChange: "",
            maxChange: "",
            inflationAdjustment: false,
            isMarried: false,
            userPercentage: "",
            isSocialSecurity: false,
            isDiscretionary: false,
            assetAllocationType: "",
            maxCash: "",
            fixedAllocation: [],
            initialAllocation: [],
            finalAllocation: [],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let calculatedStartYear;
        let calculatedDuration;
        let calculatedExpectedChange = 0;

        // Determine the start year based on the selected type
        switch (event.startYearType) {
            case "fixed":
                calculatedStartYear = event.startYear;
                break;
            case "normal":
                calculatedStartYear = Math.round(
                    generateRandomFromNormal(event.meanStartYear, event.stdDevStartYear)
                );
                break;
            case "uniform":
                calculatedStartYear = Math.round(
                    generateRandomFromUniform(event.minStartYear, event.maxStartYear)
                );
                break;
            case "sameAsAnotherEvent":
                // Find the referenced EventSeries from the eventSeries
                const referencedEventSame = eventSeries.find(series => series.name === event.anotherEventSeries);
                calculatedStartYear = referencedEventSame.startYear;
                break;
            case "yearAfterAnotherEvent":
                // Find the referenced EventSeries from the already fetched eventSeries
                const referencedEventAfter = eventSeries.find(series => series.name === event.anotherEventSeries);
                calculatedStartYear = referencedEventAfter.startYear + referencedEventAfter.duration;
                break;
            default:
                console.error("Invalid startYearType");
                return;
        }

        // Determine the duration based on the selected type
        switch (event.durationType) {
            case "fixed":
                calculatedDuration = event.duration;
                break;
            case "normal":
                calculatedDuration = Math.max(
                    1,
                    Math.round(generateRandomFromNormal(event.meanDuration, event.stdDevDuration))
                ); // Ensure duration is at least 1
                break;
            case "uniform":
                calculatedDuration = Math.max(
                    1,
                    Math.round(generateRandomFromUniform(event.minDuration, event.maxDuration))
                );
                break;
            default:
                console.error("Invalid durationType");
                return;
        }

        // Create base event object
        let eventData = {
            name: event.name,
            description: event.description,
            startYearType: event.startYearType,
            startYear: calculatedStartYear,
            durationType: event.durationType,
            duration: calculatedDuration,
            eventType: event.eventType,
        };

        // Handle event type-specific data
        if (event.eventType === "income" || event.eventType === "expense") {
            // Determine the expected annual change
            switch (event.expectedChangeType) {
                case "fixedAmount":
                    calculatedExpectedChange = event.expectedChangeAmount || 0;
                    break;
                case "fixedPercentage":
                    calculatedExpectedChange = event.expectedChangePercentage || 0;
                    break;
                case "randomAmount":
                    calculatedExpectedChange = generateRandomFromNormal(event.meanChange, event.stdDevChange);
                    break;
                case "uniformAmount":
                    calculatedExpectedChange = generateRandomFromUniform(event.minChange, event.maxChange);
                    break;
                case "randomPercentage":
                    calculatedExpectedChange = generateRandomFromNormal(event.meanChange, event.stdDevChange);
                    break;
                case "uniformPercentage":
                    calculatedExpectedChange = generateRandomFromUniform(event.minChange, event.maxChange);
                    break;
                default:
                    console.error("Invalid expectedChangeType");
                    return;
            }

            eventData = {
                ...eventData,
                initialAmount: event.initialAmount,
                expectedChangeType: event.expectedChangeType,
                expectedChange: calculatedExpectedChange,
                inflationAdjustment: event.inflationAdjustment,
                isMarried: event.isMarried,
                userPercentage: event.userPercentage || 0,
                isSocialSecurity: event.isSocialSecurity,
                isDiscretionary: event.isDiscretionary,
            };
        }

        if (event.eventType === "invest" || event.eventType === "rebalance") {
            eventData = {
                ...eventData,
                assetAllocationType: event.assetAllocationType,
                fixedAllocation: event.fixedAllocation || [],
                initialAllocation: event.initialAllocation || [],
                finalAllocation: event.finalAllocation || [],
                maxCash: event.maxCash || 0,
            };
        }

        try {
            await axiosClient.post("/api/event-series", eventData);

            alert("Event submitted successfully!");

            // Clear the form after successful submission
            setEvent({
                name: "",
                description: "",
                startYearType: "fixed", // default to fixed
                startYear: "",
                meanStartYear: "",
                stdDevStartYear: "",
                minStartYear: "",
                maxStartYear: "",
                anotherEventSeries: "",
                durationType: "fixed", // default to fixed
                duration: "",
                meanDuration: "",
                stdDevDuration: "",
                minDuration: "",
                maxDuration: "",
                eventType: "income", // default to income
                initialAmount: "",
                expectedChangeType: "fixed", // default to fixed
                expectedChange: "",
                expectedChangeAmount: "",
                expectedChangePercentage: "",
                meanChange: "",
                stdDevChange: "",
                minChange: "",
                maxChange: "",
                inflationAdjustment: false,
                isMarried: false,
                userPercentage: "",
                isSocialSecurity: false,
                isDiscretionary: false,
                assetAllocationType: "",
                maxCash: "",
                fixedAllocation: [],
                initialAllocation: [],
                finalAllocation: [],
            });
        } catch (error) {
            console.error("Error submitting event:", error);
        }
    };

    const generateRandomFromNormal = (mean, stdDev) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Number(mean) + z0 * stdDev;
    };

    const generateRandomFromUniform = (min, max) => {
        return Math.random() * (max - min) + Number(min);
    };

    return (
        <form className="event-form" onSubmit={handleSubmit}>
            <h2>Add Event Series</h2>
            <label>
                Name <span className="required">*</span>
            </label>
            <input
                type="text"
                name="name"
                value={event.name}
                onChange={handleChange}
                required
            />

            {/* Description (optional) */}
            <label>Description</label>
            <textarea
                name="description"
                value={event.description}
                onChange={handleChange}
            ></textarea>

            {/* Start Year */}
            <label>
                Start Year <span className="required">*</span>
            </label>
            <div>
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="startYearType"
                            value="fixed"
                            checked={event.startYearType === "fixed"}
                            onChange={handleRadioChange}
                        />
                        Fixed Year
                    </label>
                    {event.startYearType === "fixed" && (
                        <input
                            type="number"
                            name="startYear"
                            value={event.startYear}
                            onChange={handleChange}
                            required
                        />
                    )}
                </div>

                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="startYearType"
                            value="normal"
                            checked={event.startYearType === "normal"}
                            onChange={handleRadioChange}
                        />
                        Random (Normal Distribution)
                    </label>
                    {/* Normal Distribution Inputs */}
                    {event.startYearType === "normal" && (
                        <>
                            <input
                                type="number"
                                name="meanStartYear"
                                placeholder="Mean"
                                value={event.meanStartYear}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="stdDevStartYear"
                                placeholder="Standard Deviation"
                                value={event.stdDevStartYear}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}
                </div>

                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="startYearType"
                            value="uniform"
                            checked={event.startYearType === "uniform"}
                            onChange={handleRadioChange}
                        />
                        Random (Uniform Distribution)
                    </label>
                    {/* Uniform Distribution Inputs */}
                    {event.startYearType === "uniform" && (
                        <>
                            <input
                                type="number"
                                name="minStartYear"
                                placeholder="Minimum Year"
                                value={event.minStartYear}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="maxStartYear"
                                placeholder="Maximum Year"
                                value={event.maxStartYear}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}
                </div>

                {/* Same Year as Another Event */}
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="startYearType"
                            value="sameAsAnotherEvent"
                            checked={event.startYearType === "sameAsAnotherEvent"}
                            onChange={handleRadioChange}
                        />
                        Same Year as Another Event Starts
                    </label>
                    {event.startYearType === "sameAsAnotherEvent" && (
                        <select
                            name="anotherEventSeries"
                            value={event.anotherEventSeries}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Event Series</option>
                            {eventSeries.map((series) => (
                                <option key={series._id} value={series.name}>
                                    {series.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Year After Another Event */}
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="startYearType"
                            value="yearAfterAnotherEvent"
                            checked={event.startYearType === "yearAfterAnotherEvent"}
                            onChange={handleRadioChange}
                        />
                        Year After Another Event Ends
                    </label>
                    {event.startYearType === "yearAfterAnotherEvent" && (
                        <select
                            name="anotherEventSeries"
                            value={event.anotherEventSeries}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Event Series</option>
                            {eventSeries.map((series) => (
                                <option key={series._id} value={series.name}>
                                    {series.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Duration */}
            <label>
                Duration (Years) <span className="required">*</span>
            </label>
            <div>
                {/* Fixed Duration */}
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="durationType"
                            value="fixed"
                            checked={event.durationType === "fixed"}
                            onChange={handleRadioChange}
                        />
                        Fixed Duration
                    </label>
                    {event.durationType === "fixed" && (
                        <input
                            type="number"
                            name="duration"
                            value={event.duration}
                            onChange={handleChange}
                            required
                        />
                    )}
                </div>

                {/* Normal Distribution Duration */}
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="durationType"
                            value="normal"
                            checked={event.durationType === "normal"}
                            onChange={handleRadioChange}
                        />
                        Random (Normal Distribution)
                    </label>
                    {event.durationType === "normal" && (
                        <>
                            <input
                                type="number"
                                name="meanDuration"
                                placeholder="Mean"
                                value={event.meanDuration}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="stdDevDuration"
                                placeholder="Standard Deviation"
                                value={event.stdDevDuration}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}
                </div>

                {/* Uniform Distribution Duration */}
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="durationType"
                            value="uniform"
                            checked={event.durationType === "uniform"}
                            onChange={handleRadioChange}
                        />
                        Random (Uniform Distribution)
                    </label>
                    {event.durationType === "uniform" && (
                        <>
                            <input
                                type="number"
                                name="minDuration"
                                placeholder="Minimum Duration"
                                value={event.minDuration}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="number"
                                name="maxDuration"
                                placeholder="Maximum Duration"
                                value={event.maxDuration}
                                onChange={handleChange}
                                required
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Event Type */}
            <label>
                Event Type <span className="required">*</span>
            </label>
            <select
                name="eventType"
                value={event.eventType}
                onChange={handleChange}
                required
            >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="invest">Invest</option>
                <option value="rebalance">Rebalance</option>
            </select>

            {/* Event Specific Fields */}
            {event.eventType === "income" && (
                <>
                    {/* Income Specific Fields */}
                    <div className="radio-group">
                        <label>
                            Initial Amount <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            name="initialAmount"
                            value={event.initialAmount}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label>
                            Expected Annual Change <span className="required">*</span>
                        </label>
                        <div>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="fixedAmount"
                                        checked={event.expectedChangeType === "fixedAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Amount
                                </label>
                                {event.expectedChangeType === "fixedAmount" && (
                                    <input
                                        type="number"
                                        name="expectedChangeAmount"
                                        value={event.expectedChangeAmount}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="fixedPercentage"
                                        checked={event.expectedChangeType === "fixedPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Percentage
                                </label>
                                {event.expectedChangeType === "fixedPercentage" && (
                                    <input
                                        type="number"
                                        name="expectedChangePercentage"
                                        value={event.expectedChangePercentage}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="randomAmount"
                                        checked={event.expectedChangeType === "randomAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Amount (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "randomAmount" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanChange"
                                            placeholder="Mean"
                                            value={event.meanChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="uniformAmount"
                                        checked={event.expectedChangeType === "uniformAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Amount (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniformAmount" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minChange"
                                            placeholder="Minimum Uniform Amount"
                                            value={event.minChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxChange"
                                            placeholder="Maximum Uniform Amount"
                                            value={event.maxChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="randomPercentage"
                                        checked={event.expectedChangeType === "randomPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Percentage (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "randomPercentage" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanChange"
                                            placeholder="Mean"
                                            value={event.meanChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="uniformPercentage"
                                        checked={event.expectedChangeType === "uniformPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Percentage (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniformPercentage" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minChange"
                                            placeholder="Minimum Uniform Percentage"
                                            value={event.minChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxChange"
                                            placeholder="Maximum Uniform Percentage"
                                            value={event.maxChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="radio-group">
                        <label>
                            Inflation Adjustment
                        </label>
                        <input
                            type="checkbox"
                            name="inflationAdjustment"
                            checked={event.inflationAdjustment}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="radio-group">
                        <label>
                            Married?
                        </label>
                        <input
                            type="checkbox"
                            name="isMarried"
                            checked={event.isMarried}
                            onChange={handleChange}
                        />
                    </div>

                    {event.isMarried && (
                        <div className="radio-group">
                            <label>
                                Percentage Associated with User <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                name="userPercentage"
                                value={event.userPercentage}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="radio-group">
                        <label>
                            Social Security?
                        </label>
                        <input
                            type="checkbox"
                            name="isSocialSecurity"
                            checked={event.isSocialSecurity}
                            onChange={handleChange}
                        />
                    </div>
                </>
            )}

            {event.eventType === "expense" && (
                <>
                    {/* Expense Specific Fields */}
                    <div className="radio-group">
                        <label>
                            Initial Amount <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            name="initialAmount"
                            value={event.initialAmount}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label>
                            Expected Annual Change <span className="required">*</span>
                        </label>
                        <div>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="fixedAmount"
                                        checked={event.expectedChangeType === "fixedAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Amount
                                </label>
                                {event.expectedChangeType === "fixedAmount" && (
                                    <input
                                        type="number"
                                        name="expectedChangeAmount"
                                        value={event.expectedChangeAmount}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="fixedPercentage"
                                        checked={event.expectedChangeType === "fixedPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Percentage
                                </label>
                                {event.expectedChangeType === "fixedPercentage" && (
                                    <input
                                        type="number"
                                        name="expectedChangePercentage"
                                        value={event.expectedChangePercentage}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="randomAmount"
                                        checked={event.expectedChangeType === "randomAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Amount (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "randomAmount" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanChange"
                                            placeholder="Mean"
                                            value={event.meanChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="uniformAmount"
                                        checked={event.expectedChangeType === "uniformAmount"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Amount (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniformAmount" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minChange"
                                            placeholder="Minimum Uniform Amount"
                                            value={event.minChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxChange"
                                            placeholder="Maximum Uniform Amount"
                                            value={event.maxChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="randomPercentage"
                                        checked={event.expectedChangeType === "randomPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Percentage (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "randomPercentage" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanChange"
                                            placeholder="Mean"
                                            value={event.meanChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>

                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="expectedChangeType"
                                        value="uniformPercentage"
                                        checked={event.expectedChangeType === "uniformPercentage"}
                                        onChange={handleRadioChange}
                                    />
                                    Random Percentage (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniformPercentage" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minChange"
                                            placeholder="Minimum Uniform Percentage"
                                            value={event.minChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxChange"
                                            placeholder="Maximum Uniform Percentage"
                                            value={event.maxChange}
                                            onChange={handleChange}
                                            required
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="radio-group">
                        <label>
                            Inflation Adjustment
                        </label>
                        <input
                            type="checkbox"
                            name="inflationAdjustment"
                            checked={event.inflationAdjustment}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="radio-group">
                        <label>
                            Married?
                        </label>
                        <input
                            type="checkbox"
                            name="maritalStatus"
                            checked={event.maritalStatus}
                            onChange={handleChange}
                        />
                    </div>

                    {event.maritalStatus && (
                        <div className="radio-group">
                            <label>
                                Percentage Associated with User <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                name="maritalPercentage"
                                value={event.maritalPercentage}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}


                    <div className="radio-group">
                        <label>
                            Discretionary Expense?
                        </label>
                        <input
                            type="checkbox"
                            name="isDiscretionary"
                            checked={event.isDiscretionary}
                            onChange={handleChange}
                        />
                    </div>
                </>
            )}

            {event.eventType === "invest" && (
                <>
                    {/* Invest Specific Fields */}
                    <div>
                        <label>
                            Asset Allocation Type <span className="required">*</span>
                        </label>
                        <div>
                            <div className="radio-group">
                                {/* Fixed Allocation Option */}
                                <label>
                                    <input
                                        type="radio"
                                        name="assetAllocationType"
                                        value="fixed"
                                        checked={event.assetAllocationType === "fixed"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Allocation
                                </label>
                                {event.assetAllocationType === "fixed" && (
                                    <div>
                                        <label>Enter Fixed Percentages for Each Investment (Sum must equal 100%)</label>
                                        {investments.map((investment, index) => (
                                            <div key={index} className="radio-group">
                                                <label>{investment.name}</label>
                                                <input
                                                    type="number"
                                                    name={`allocation_${index}`}
                                                    value={investment.percentage}
                                                    onChange={(e) => handleAllocationChange(e, index)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Glide Path Allocation Option */}
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="assetAllocationType"
                                        value="glidepath"
                                        checked={event.assetAllocationType === "glidepath"}
                                        onChange={handleRadioChange}
                                    />
                                    Glide Path Allocation
                                </label>
                                {event.assetAllocationType === "glidepath" && (
                                    <div>
                                        <label>Initial Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`initialAllocation_${index}`}
                                                        value={investment.initialPercentage}
                                                        onChange={(e) => handleGlidePathChange(e, index, "initial")}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <label>Final Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`finalAllocation_${index}`}
                                                        value={investment.finalPercentage}
                                                        onChange={(e) => handleGlidePathChange(e, index, "final")}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="radio-group">
                        <label>
                            Maximum Cash Amount <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            name="maxCash"
                            value={event.maxCash}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </>
            )}

            {event.eventType === "rebalance" && (
                <>
                    {/* Rebalance Specific Fields */}
                    <div>
                        <label>
                            Rebalance Asset Allocation <span className="required">*</span>
                        </label>
                        <div>
                            {/* Fixed Allocation Option */}
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="assetAllocationType"
                                        value="fixed"
                                        checked={event.assetAllocationType === "fixed"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Allocation
                                </label>
                                {event.assetAllocationType === "fixed" && (
                                    <div>
                                        <label>Enter Fixed Percentages for Each Investment (Sum must equal 100%)</label>
                                        {/* Add input fields for investments here */}
                                        {investments.map((investment, index) => (
                                            <div key={index} className="radio-group">
                                                <label>{investment.name}</label>
                                                <input
                                                    type="number"
                                                    name={`rebalanceAllocation_${index}`}
                                                    value={investment.rebalancePercentage}
                                                    onChange={(e) => handleAllocationChange(e, index)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Glide Path Allocation Option */}
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="assetAllocationType"
                                        value="glidepath"
                                        checked={event.assetAllocationType === "glidepath"}
                                        onChange={handleRadioChange}
                                    />
                                    Glide Path Allocation
                                </label>
                                {event.assetAllocationType === "glidepath" && (
                                    <div>
                                        <label>Initial Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`rebalanceInitialAllocation_${index}`}
                                                        value={investment.rebalanceInitialPercentage}
                                                        onChange={(e) => handleGlidePathChange(e, index, "initial")}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <label>Final Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`rebalanceFinalAllocation_${index}`}
                                                        value={investment.rebalanceFinalPercentage}
                                                        onChange={(e) => handleGlidePathChange(e, index, "final")}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            )}

            <div className="button-group">
                <button type="submit">Submit</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
            </div>
        </form>
    );
};

export default EventForm;
