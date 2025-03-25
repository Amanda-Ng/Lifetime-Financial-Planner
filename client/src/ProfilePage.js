import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProfilePage.css";
import "./App.css";

function ProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetch_user_profile = async () => {
            try {
                const { data } = await axios.get("http://localhost:8000/auth/api/profile", {
                    withCredentials: true, // include session cookie in the request
                });
                setUser(data.user);
            } catch (error) {
                console.error("Error fetching user profile: ", error);
            }
        };
        fetch_user_profile();
    });

    if (!user) {
        return <p>Loading profile...</p>;
    }

    return (
        <div id="profileContainer">
            <div className="profile1">
                <img src="userPfp.png" alt="userPfp" className="userPfp_large" />
                <div className="section_header">{user.name || "John Doe"}</div>
                <div>
                    <img src="mail.png" alt="mail_icon" className="small_icon" />
                    {user.email || "johndoe@gmail.com"}
                </div>
                <div className="profile_lower">
                    <img src="file.png" alt="file_icon" className="small_icon" />
                    View and upload state tax files
                </div>{" "}
                {/* !!Add action to text above */}
            </div>
            <div className="profile2">
                <div className="section_header">Personal Profile Info</div>
                <img src="editPage.png" alt="editProfile" className="editPage_icon" />
                <div>Name, age, profile photo</div>
                <div className="update_info_option">UPDATE INFO &gt;</div>
            </div>{" "}
            {/* !!Add action to text above */}
            <div className="profile4">
                <div className="section_header">Recent Activity</div>
                <div className="description">Populated automatically with data about any new changes or additions to your account.</div>

                <div id="log_table">
                    <div>
                        <span className="leftEntry">Date</span>
                        <span>Log Detail</span>
                    </div>
                    <div></div> {/* !!Add div to for each entry */}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
