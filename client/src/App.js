import React from "react";
import "./App.css";
import Sidebar from "./Sidebar";

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="App-content">
        <header className="App-header">
          <p>Welcome to the Financial Planner App!</p>
        </header>
      </div>
    </div>
  );
}

export default App;
