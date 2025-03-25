import React, { useState } from "react";
import { axiosClient } from "./services/apiClient";

const InvestmentForm = () => {
  const [investment, setInvestment] = useState({
    name: "",
    description: "",
    returnType: "fixed",
    fixedReturnAmount: "",
    meanReturnAmount: "",
    stdDevReturnAmount: "",
    fixedReturnPercentage: "",
    meanReturnPercentage: "",
    stdDevReturnPercentage: "",
    expenseRatio: "",
    incomeType: "fixed",
    fixedIncomeAmount: "",
    meanIncomeAmount: "",
    stdDevIncomeAmount: "",
    fixedIncomePercentage: "",
    meanIncomePercentage: "",
    stdDevIncomePercentage: "",
    taxability: "taxable",
    value: "",
    taxStatus: "non-retirement",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvestment((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    // Clear form when canceled
    setInvestment({
      name: "",
      description: "",
      returnType: "fixed",
      fixedReturnAmount: "",
      meanReturnAmount: "",
      stdDevReturnAmount: "",
      fixedReturnPercentage: "",
      meanReturnPercentage: "",
      stdDevReturnPercentage: "",
      expenseRatio: "",
      incomeType: "fixed",
      fixedIncomeAmount: "",
      meanIncomeAmount: "",
      stdDevIncomeAmount: "",
      fixedIncomePercentage: "",
      meanIncomePercentage: "",
      stdDevIncomePercentage: "",
      taxability: "taxable",
      value: "",
      taxStatus: "non-retirement",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let expectedAnnualReturn = 0;
    let expectedAnnualIncome = 0;

    // Calculate Expected Annual Return
    if (investment.returnType === "fixedAmount") {
      expectedAnnualReturn = investment.fixedReturnAmount;
    } else if (investment.returnType === "fixedPercentage") {
      expectedAnnualReturn = investment.value * (investment.fixedReturnPercentage / 100);
    } else if (investment.returnType === "randomAmount") {
      expectedAnnualReturn = generateRandomFromNormal(investment.meanReturnAmount, investment.stdDevReturnAmount);
    } else if (investment.returnType === "randomPercentage") {
      const randomPercentage = generateRandomFromNormal(investment.meanReturnPercentage, investment.stdDevReturnPercentage);
      expectedAnnualReturn = investment.value * (randomPercentage / 100);
    }

    // Calculate Expected Annual Income
    if (investment.incomeType === "fixedAmount") {
      expectedAnnualIncome = investment.fixedIncomeAmount;
    } else if (investment.incomeType === "fixedPercentage") {
      expectedAnnualIncome = investment.value * (investment.fixedIncomePercentage / 100);
    } else if (investment.incomeType === "randomAmount") {
      expectedAnnualIncome = generateRandomFromNormal(investment.meanIncomeAmount, investment.stdDevIncomeAmount);
    } else if (investment.incomeType === "randomPercentage") {
      const randomPercentage = generateRandomFromNormal(investment.meanIncomePercentage, investment.stdDevIncomePercentage);
      expectedAnnualIncome = investment.value * (randomPercentage / 100);
    }

    const investmentTypeData = {
      name: investment.name,
      description: investment.description,
      expected_annual_return: expectedAnnualReturn,
      expected_annual_income: expectedAnnualIncome,
      returnType: investment.returnType,
      incomeType: investment.incomeType,
      expense_ratio: investment.expenseRatio,
      taxability: investment.taxability,
    };

    try {
      const responseType = await axiosClient.post("/api/investmentTypes", investmentTypeData);

      const newInvestmentType = responseType.data;

      const investmentData = {
        investmentType: newInvestmentType._id,
        value: investment.value,
        tax_status: investment.taxStatus,
      };

      await axiosClient.post("/api/investments", investmentData);

      alert("Investment added successfully!");

      // Reset the form after success
      setInvestment({
        name: "",
        description: "",
        returnType: "fixed",
        fixedReturnAmount: "",
        meanReturnAmount: "",
        stdDevReturnAmount: "",
        fixedReturnPercentage: "",
        meanReturnPercentage: "",
        stdDevReturnPercentage: "",
        expenseRatio: "",
        incomeType: "fixed",
        fixedIncomeAmount: "",
        meanIncomeAmount: "",
        stdDevIncomeAmount: "",
        fixedIncomePercentage: "",
        meanIncomePercentage: "",
        stdDevIncomePercentage: "",
        taxability: "taxable",
        value: "",
        taxStatus: "non-retirement",
      });
    } catch (error) {
      alert("Error submitting the form.");
      console.error("Error submitting form:", error);
    }
  };

  const generateRandomFromNormal = (mean, stdDev) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Number(mean) + z0 * stdDev;
  };

  return (
    <form className="investment-form" onSubmit={handleSubmit}>
      <h2>Add Investment</h2>

      {/* Name */}
      <label>Name <span className="required">*</span></label>
      <input
        type="text"
        name="name"
        value={investment.name}
        onChange={handleChange}
        required
      />

      {/* Description */}
      <label>Description:</label>
      <textarea
        name="description"
        value={investment.description}
        onChange={handleChange}
      />

      {/* Expected Annual Return */}
      <label>Expected Annual Return <span className="required">*</span></label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="returnType"
            value="fixedAmount"
            checked={investment.returnType === "fixedAmount"}
            onChange={handleChange}
          />
          Fixed Amount
        </label>
        {investment.returnType === "fixedAmount" && (
          <input
            type="number"
            name="fixedReturnAmount"
            placeholder="Enter fixed amount"
            value={investment.fixedReturnAmount}
            onChange={handleChange}
            required
          />
        )}
      </div>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="returnType"
            value="fixedPercentage"
            checked={investment.returnType === "fixedPercentage"}
            onChange={handleChange}
          />
          Fixed Percentage
        </label>
        {investment.returnType === "fixedPercentage" && (
          <input
            type="number"
            name="fixedReturnPercentage"
            placeholder="Enter percentage"
            value={investment.fixedReturnPercentage}
            onChange={handleChange}
            required
          />
        )}
      </div>

      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="returnType"
            value="randomAmount"
            checked={investment.returnType === "randomAmount"}
            onChange={handleChange}
          />
          Random (Amount from Normal Distribution)
        </label>
        {investment.returnType === "randomAmount" && (
          <>
            <input
              type="number"
              name="meanReturnAmount"
              placeholder="Mean Amount"
              value={investment.meanReturnAmount}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevReturnAmount"
              placeholder="Standard Deviation"
              value={investment.stdDevReturnAmount}
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
            name="returnType"
            value="randomPercentage"
            checked={investment.returnType === "randomPercentage"}
            onChange={handleChange}
          />
          Random (Percentage from Normal Distribution)
        </label>
        {investment.returnType === "randomPercentage" && (
          <>
            <input
              type="number"
              name="meanReturnPercentage"
              placeholder="Mean Percentage"
              value={investment.meanReturnPercentage}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevReturnPercentage"
              placeholder="Standard Deviation"
              value={investment.stdDevReturnPercentage}
              onChange={handleChange}
              required
            />
          </>
        )}
      </div>

      {/* Expense Ratio */}
      <label>Expense Ratio(%) <span className="required">*</span></label>
      <input
        type="number"
        name="expenseRatio"
        value={investment.expenseRatio}
        onChange={handleChange}
        required
      />

      {/* Expected Annual Income */}
      <label>Expected Annual Income <span className="required">*</span></label>
      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="incomeType"
            value="fixedAmount"
            checked={investment.incomeType === "fixedAmount"}
            onChange={handleChange}
          />
          Fixed Amount
        </label>
        {investment.incomeType === "fixedAmount" && (
          <input
            type="number"
            name="fixedIncomeAmount"
            placeholder="Enter fixed amount"
            value={investment.fixedIncomeAmount}
            onChange={handleChange}
            required
          />
        )}
      </div>

      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="incomeType"
            value="fixedPercentage"
            checked={investment.incomeType === "fixedPercentage"}
            onChange={handleChange}
          />
          Fixed Percentage
        </label>
        {investment.incomeType === "fixedPercentage" && (
          <input
            type="number"
            name="fixedIncomePercentage"
            placeholder="Enter percentage"
            value={investment.fixedIncomePercentage}
            onChange={handleChange}
            required
          />
        )}
      </div>

      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="incomeType"
            value="randomAmount"
            checked={investment.incomeType === "randomAmount"}
            onChange={handleChange}
          />
          Random (Amount from Normal Distribution)
        </label>
        {investment.incomeType === "randomAmount" && (
          <>
            <input
              type="number"
              name="meanIncomeAmount"
              placeholder="Mean Amount"
              value={investment.meanIncomeAmount}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevIncomeAmount"
              placeholder="Standard Deviation"
              value={investment.stdDevIncomeAmount}
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
            name="incomeType"
            value="randomPercentage"
            checked={investment.incomeType === "randomPercentage"}
            onChange={handleChange}
          />
          Random (Percentage from Normal Distribution)
        </label>
        {investment.incomeType === "randomPercentage" && (
          <>
            <input
              type="number"
              name="meanIncomePercentage"
              placeholder="Mean Percentage"
              value={investment.meanIncomePercentage}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevIncomePercentage"
              placeholder="Standard Deviation"
              value={investment.stdDevIncomePercentage}
              onChange={handleChange}
              required
            />
          </>
        )}
      </div>

      {/* Taxability */}
      <label>Taxability <span className="required">*</span></label>
      <select name="taxability" value={investment.taxability} onChange={handleChange} required>
        <option value="taxable">Taxable</option>
        <option value="tax-exempt">Tax-Exempt</option>
      </select>

      {/* Value */}
      <label>Value <span className="required">*</span></label>
      <input
        type="number"
        name="value"
        value={investment.value}
        onChange={handleChange}
        required
      />

      {/* Account Status */}
      <label>Account Status <span className="required">*</span></label>
      <select name="taxStatus" value={investment.taxStatus} onChange={handleChange} required>
        <option value="non-retirement">Non-Retirement</option>
        <option value="pre-tax retirement">Pre-Tax Retirement</option>
        <option value="after-tax retirement">After-Tax Retirement</option>
      </select>

      {/* Buttons */}
      <div className="button-group">
        <button type="submit">Add Investment</button>
        <button type="button" onClick={handleCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default InvestmentForm;
