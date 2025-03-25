import React from "react"; 
import "./Scenario.css"; 
import { Link } from "react-router-dom";
 

function Scenario(){
    return(
    <div id="scenario-container" >
        <div className="scenario1">
            <div>
                <img src="kite.png" alt="kite_icon" className="big_icon"/>
                <span className="subsub_header">Scenario Name</span>
            </div>
            <div>{/* !!Display chart here */}</div>
             
        </div>
        <div className="scenario2">
            <div>
                <img src="add.png" alt="add_icon" className="big_icon"/>
                <Link to="/scenarioForm" className="subsub_header">Create New Scenario</Link>
            </div> 
            <div>
                <img src="import.png" alt="import_icon" className="big_icon"/>
                <span className="subsub_header">Import Scenario</span>
            </div>
            <div>
                <img src="export.png" alt="export_icon" className="big_icon"/>
                <span className="subsub_header">Export Scenario</span>
            </div>
             
             
             
        </div> 
    </div>
        
    )
} 

export default Scenario