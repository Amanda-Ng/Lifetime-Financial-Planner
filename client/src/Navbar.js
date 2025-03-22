import React from "react"; 
import "./Navbar.css";

function Navbar(){
    return(
    <nav className="navbar" >
        <img src="headerIcon.png" alt="headerIcon" id="headerIcon"/> 
        <p>CitriFi</p> 
        <button><img src="userPfp.png" alt="headerPfp" className="userPfp_small"/> 
            <span>Username</span> 
        </button>
    </nav>
        
    )
} 

export default Navbar