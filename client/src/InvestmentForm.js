import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const InvestmentForm = () => {
  const navigate = useNavigate();
  const [investment, setInvestment] = useState({
    name: "",
    description: "",
    returnType: "fixed",
    fixedReturn: "",
    meanReturn: "",
    stdDevReturn: "",
    expenseRatio: "",
    incomeType: "fixed",
    fixedIncome: "",
    meanIncome: "",
    stdDevIncome: "",
    taxability: "taxable",
    value: "",
    accountStatus: "non-retirement",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvestment((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/");  // Redirect to homepage when canceled
  };

  return (
    <form className="investment-form">
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
            value="fixed"
            checked={investment.returnType === "fixed"}
            onChange={handleChange}
          />
          Fixed Value
        </label>
        {investment.returnType === "fixed" && (
          <input
            type="number"
            name="fixedReturn"
            value={investment.fixedReturn}
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
            value="random"
            checked={investment.returnType === "random"}
            onChange={handleChange}
          />
          Random (Normal Distribution)
        </label>
        {investment.returnType === "random" && (
          <>
            <input
              type="number"
              name="meanReturn"
              placeholder="Mean"
              value={investment.meanReturn}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevReturn"
              placeholder="Standard Deviation"
              value={investment.stdDevReturn}
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
            value="fixed"
            checked={investment.incomeType === "fixed"}
            onChange={handleChange}
          />
          Fixed Value
        </label>
        {investment.incomeType === "fixed" && (
          <input
            type="number"
            name="fixedIncome"
            value={investment.fixedIncome}
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
            value="random"
            checked={investment.incomeType === "random"}
            onChange={handleChange}
          />
          Random (Normal Distribution)
        </label>
        {investment.incomeType === "random" && (
          <>
            <input
              type="number"
              name="meanIncome"
              placeholder="Mean"
              value={investment.meanIncome}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="stdDevIncome"
              placeholder="Standard Deviation"
              value={investment.stdDevIncome}
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
      <select name="accountStatus" value={investment.accountStatus} onChange={handleChange} required>
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
