import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EventForm = () => {
    const navigate = useNavigate();
    const [event, setEvent] = useState({
        name: "",
        description: "",
        startYearType: "fixed", // default to fixed
        startYear: "",
        durationType: "fixed", // default to fixed
        duration: "",
        eventType: "income", // default to income
        initialAmount: "",
        expectedChangeType: "fixed", // default to fixed
        expectedChange: "",
        inflationAdjustment: false,
        isMarried: false,
        spousePercentage: "",
        isSocialSecurity: false,
        isWages: false,
        isDiscretionary: false,
        assetAllocation: "",
        maxCash: "",
        rebalanceAllocation: "",
    });

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

    const handleCancel = () => {
        navigate("/");  // Redirect to homepage when canceled
    };

    return (
        <form className="event-form">
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
                            name="eventSeriesStart"
                            value={event.eventSeriesStart}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Event Series</option>
                            {/* TODO */}
                            {/* {eventSeries.map((series, index) => (
          <option key={index} value={series.id}>
            {series.name}
          </option>
        ))} */}
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
                            name="eventSeriesEnd"
                            value={event.eventSeriesEnd}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Event Series</option>
                            {/* TODO */}
                            {/* {eventSeries.map((series, index) => (
          <option key={index} value={series.id}>
            {series.name}
          </option>
        ))} */}
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
                                        value="fixed"
                                        checked={event.expectedChangeType === "fixed"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Amount or Percentage
                                </label>
                                {event.expectedChangeType === "fixed" && (
                                    <input
                                        type="number"
                                        name="expectedChange"
                                        value={event.expectedChange}
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
                                        value="uniform"
                                        checked={event.expectedChangeType === "uniform"}
                                        onChange={handleRadioChange}
                                    />
                                    Random (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniform" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minExpectedChange"
                                            placeholder="Minimum Expected Change"
                                            value={event.minExpectedChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxExpectedChange"
                                            placeholder="Maximum Expected Change"
                                            value={event.maxExpectedChange}
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
                                        value="normal"
                                        checked={event.expectedChangeType === "normal"}
                                        onChange={handleRadioChange}
                                    />
                                    Random (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "normal" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanExpectedChange"
                                            placeholder="Mean"
                                            value={event.meanExpectedChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevExpectedChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevExpectedChange}
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
                            Married? <span className="required">*</span>
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
                                        value="fixed"
                                        checked={event.expectedChangeType === "fixed"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Amount or Percentage
                                </label>
                                {event.expectedChangeType === "fixed" && (
                                    <input
                                        type="number"
                                        name="expectedChange"
                                        value={event.expectedChange}
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
                                        value="uniform"
                                        checked={event.expectedChangeType === "uniform"}
                                        onChange={handleRadioChange}
                                    />
                                    Random (Uniform Distribution)
                                </label>
                                {event.expectedChangeType === "uniform" && (
                                    <>
                                        <input
                                            type="number"
                                            name="minExpectedChange"
                                            placeholder="Minimum Expected Change"
                                            value={event.minExpectedChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="maxExpectedChange"
                                            placeholder="Maximum Expected Change"
                                            value={event.maxExpectedChange}
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
                                        value="normal"
                                        checked={event.expectedChangeType === "normal"}
                                        onChange={handleRadioChange}
                                    />
                                    Random (Normal Distribution)
                                </label>
                                {event.expectedChangeType === "normal" && (
                                    <>
                                        <input
                                            type="number"
                                            name="meanExpectedChange"
                                            placeholder="Mean"
                                            value={event.meanExpectedChange}
                                            onChange={handleChange}
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="stdDevExpectedChange"
                                            placeholder="Standard Deviation"
                                            value={event.stdDevExpectedChange}
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
                            Married? <span className="required">*</span>
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
                                    // TODO
                                    <div>
                                        <label>Enter Fixed Percentages for Each Investment (Sum must equal 100%)</label>
                                        {/* {event.investments.map((investment, index) => (
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
                                    ))} */}
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
                                            {/* {event.investments.map((investment, index) => (
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
                                            ))} */}
                                        </div>
                                        <label>Final Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {/* {event.investments.map((investment, index) => (
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
                                        ))} */}
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
                                        name="rebalanceType"
                                        value="fixed"
                                        checked={event.rebalanceType === "fixed"}
                                        onChange={handleRadioChange}
                                    />
                                    Fixed Percentages
                                </label>
                                {event.rebalanceType === "fixed" && (
                                    // TODO
                                    <div>
                                        <label>Enter Fixed Percentages for Each Investment (Sum must equal 100%)</label>
                                        {/* Add input fields for investments here */}
                                        {/* {event.investments.map((investment, index) => (
                                            <div key={index} className="radio-group">
                                                <label>{investment.name}</label>
                                                <input
                                                    type="number"
                                                    name={`rebalanceAllocation_${index}`}
                                                    value={investment.rebalancePercentage}
                                                    onChange={(e) => handleRebalanceChange(e, index)}
                                                    required
                                                />
                                            </div>
                                        ))} */}
                                    </div>
                                )}
                            </div>

                            {/* Glide Path Allocation Option */}
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="rebalanceType"
                                        value="glidepath"
                                        checked={event.rebalanceType === "glidepath"}
                                        onChange={handleRadioChange}
                                    />
                                    Glide Path (Initial and Final Percentages)
                                </label>
                                {event.rebalanceType === "glidepath" && (
                                    <div>
                                        <label>Initial Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {/* {event.investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`rebalanceInitialAllocation_${index}`}
                                                        value={investment.rebalanceInitialPercentage}
                                                        onChange={(e) => handleRebalanceGlidePathChange(e, index, "initial")}
                                                        required
                                                    />
                                                </div>
                                            ))} */}
                                        </div>
                                        <label>Final Percentages (Sum must equal 100%)</label>
                                        <div className="radio-group">
                                            {/* {event.investments.map((investment, index) => (
                                                <div key={index}>
                                                    <label>{investment.name}</label>
                                                    <input
                                                        type="number"
                                                        name={`rebalanceFinalAllocation_${index}`}
                                                        value={investment.rebalanceFinalPercentage}
                                                        onChange={(e) => handleRebalanceGlidePathChange(e, index, "final")}
                                                        required
                                                    />
                                                </div>
                                            ))} */}
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
