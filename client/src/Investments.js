import React, { useEffect, useState } from "react";
import { axiosClient } from "./services/apiClient";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Investments.css";

function Investments() {
    const [investments, setInvestments] = useState([]);

    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const response = await axiosClient.get('/api/getUserInvestments', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setInvestments(response.data);
            } catch (error) {
                console.error("Error fetching investments:", error);
            }
        };

        fetchInvestments();
    }, []);

    const deleteInvestment = async (investmentId) => {
        if (!window.confirm("Are you sure you want to delete this investment?")) return;

        try {
            await axios.delete(`http://localhost:8000/api/deleteInvestment/${investmentId}`);
            setInvestments(prev => prev.filter(inv => inv._id !== investmentId));
        } catch (error) {
            console.error("Failed to delete investment:", error);
        }
    };

    return (
        <div id="investment-container">
            <div className="investment-footer">
                <div>
                    <img src="add.png" alt="add_icon" className="big_icon" />
                    <Link to="/investment" className="subsub_header">Create New Investment</Link>
                </div>
            </div>

            <h3>My Investments</h3>
            {investments.map((investment) => (
                <div key={investment._id} className="investment-card">
                    <div>
                        <span className="subsub_header">💲{investment.investmentType.name}</span>
                        <div className="investment-details">
                            <span>Value: ${investment.value}</span>
                            <span>Tax Status: {investment.tax_status}</span>
                        </div>
                    </div>
                    <button onClick={() => deleteInvestment(investment._id)} className="delete-button">
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Investments;
