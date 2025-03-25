import React from "react"; 
import "./Simulation.css";  

function Simulation(){
    return(
    <div id="simulation-container" >
         <div className="sim1">
            <div className="section_header"><strong>Simulation</strong></div>
            <div className="optionLine">
                <span>Choose scenario</span>
                <span>Parameter</span>
                <span>Step</span>
            </div>
            <div className="optionLine">
                <span>Upper bound</span>
                <span>Lower bound</span> 
            </div>
            <div className="optionLine" id="genSimLine">
                <span>View</span> 
                <button id="gen_button">Generate</button>
            </div>
             
        </div>
        <div className="sim2">
            <div className="subsub_header"><strong>Scenario Name</strong></div> 
            <div className="chart-container">
                {/* !!Display chart here */}
            </div>
             
             
             
        </div> 
    </div>
        
    )
} 

export default Simulation