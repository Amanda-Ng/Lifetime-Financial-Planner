import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./Sidebar";
import InvestmentForm from "./InvestmentForm";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/investment" element={<InvestmentForm />} />
            {/* Add more Routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
