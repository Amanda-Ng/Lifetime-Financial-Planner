import React from "react"; 
import "./ProfilePage.css";
import "./App.css";

function ProfilePage(){
    return(
    <div id="profileContainer" > 
        <div class="profile1">
            <img src="userPfp.png" alt="userPfp" className="userPfp_large"/>     
            <div className="section_header">John Doe</div>
            <div>
                <img src="mail.png" alt="mail_icon" className="small_icon"/>    
                user@gmail.com
            </div>
            <div className="profile_lower">
                <img src="file.png" alt="file_icon" className="small_icon"/>  
                View and upload state tex files  
            </div>    {/* !!Add action to text above */}
        </div> 

        <div class="profile2">
            <div className="section_header">Profile Info</div> 
            <img src="editPage.png" alt="editProfile" className="editPage_icon"/>    
            <div>Username, email, age</div>
            <div>UPDATE INFO &gt;</div>
        </div>  {/* !!Add action to text above */}

        <div class="profile3">
            <div className="section_header">Recent Activity</div>    
            <div className="description">Populated automatically with data about any new changes or additions to your account.</div>
 
            <div id="log_table">
                <div>
                    <span className="leftEntry">Date</span>
                    <span >Log Detail</span>
                </div>
                <div></div> {/* !!Add div to for each entry */}
            </div>
            
        </div>   
            
    </div>      
    )   
} 

export default ProfilePage