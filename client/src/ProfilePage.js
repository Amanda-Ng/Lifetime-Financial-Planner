import React, { useEffect, useState, useRef } from "react";
import { axiosClient } from "./services/apiClient";
import axios from "axios";
import EditProfileForm from "./EditProfileForm";
import useApp from "./hooks/useApp";
import "./ProfilePage.css";
import "./App.css";

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [activity, setActivity] = useState(null);
    const [file, setFile] = useState(null);
    const [taxState, setTaxState] = useState("");
    const [status, setStatus] = useState("");
    const { logout } = useApp();
    const fileInputRef = useRef(null); // Add a ref for the file input

    const states = [
        "Alabama",
        "Alaska",
        "Arizona",
        "Arkansas",
        "California",
        "Colorado",
        "Connecticut",
        "Delaware",
        "Florida",
        "Georgia",
        "Hawaii",
        "Idaho",
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Kentucky",
        "Louisiana",
        "Maine",
        "Maryland",
        "Massachusetts",
        "Michigan",
        "Minnesota",
        "Mississippi",
        "Missouri",
        "Montana",
        "Nebraska",
        "Nevada",
        "New Hampshire",
        "New Jersey",
        "New Mexico",
        "New York",
        "North Carolina",
        "North Dakota",
        "Ohio",
        "Oklahoma",
        "Oregon",
        "Pennsylvania",
        "Rhode Island",
        "South Carolina",
        "South Dakota",
        "Tennessee",
        "Texas",
        "Utah",
        "Vermont",
        "Virginia",
        "Washington",
        "West Virginia",
        "Wisconsin",
        "Wyoming",
    ];

    const fetch_user_profile = async () => {
        try {
            const user = await axiosClient.get("/api/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setUser(user.data);
        } catch (error) {
            console.error("Error fetching user profile: ", error);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("stateTaxYaml", file);
        formData.append("state", taxState.trim());

        try {
            const response = await axios.post("http://localhost:8000/api/uploadStateTaxYaml", formData);
            setStatus(response.data.message || "Upload successful!");
        } catch (error) {
            setStatus("Error uploading file.");
            console.error(error);
        }

        setFile(null); // Clear the state
        setTaxState(""); // Clear the state dropdown
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset the file input using the ref
        }
    };

    useEffect(() => {
        fetch_user_profile();
    }, []);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await axiosClient.get("/api/users/activity");
                setActivity(response.data);
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            }
        };
        fetchActivity();
    }, []);

    if (!user) {
        return <p>Loading profile...</p>;
    }

    return (
        <div id="profileContainer">
            <div className="profile1">
                <img src={"userPfp.png"} alt="userPfp" className="userPfp_large" />
                <div className="section_header">{user.username || "John Doe"}</div>
                <div>
                    <img src="mail.png" alt="mail_icon" className="small_icon" />
                    {user.email || "johndoe@gmail.com"}
                </div>
                <div className="profile_lower">
                    <img src="file.png" alt="file_icon" className="small_icon" />
                    View and upload state tax files
                </div>
                <form className="state-tax-upload" onSubmit={handleUpload}>
                    <input
                        ref={fileInputRef} // Attach the ref to the file input
                        type="file"
                        accept=".yaml,.yml"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <div className="state-tax-menu-selection">
                        <p>Select state: </p>
                        <select className="state-tax-dropdown" value={taxState} onChange={(e) => setTaxState(e.target.value)}>
                            <option value=""> -- Choose a state -- </option>
                            {states.map((state) => (
                                <option key={state} value={state}>
                                    {" "}
                                    {state}{" "}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">Upload YAML</button>
                </form>
                {status && <p>{status}</p>}
                {/* !!Add action to text above */}
                <div>
                    <a onClick={logout} href="/login" className="logout-button">
                        {" "}
                        Logout{" "}
                    </a>
                </div>
            </div>
            <div className="profile2">
                <div className="section_header">Personal Profile Info</div>
                <img src="editPage.png" alt="editProfile" className="editPage_icon" />
                <div className="update_info_option" onClick={() => setEditing((prev) => !prev)} style={{ cursor: "pointer" }}>
                    {editing ? "CANCEL" : "UPDATE INFO >"}
                </div>
            </div>{" "}
            {editing && <EditProfileForm userData={user} />}
            {/* !!Add action to text above */}
            <div className="profile4">
                <div className="section_header">Recent Activity</div>

                <div id="log_table">
                    <div>
                        <span className="leftEntry">Date</span>
                        <span>Log Detail</span>
                    </div>

                    {Array.isArray(activity) &&
                        activity.map((entry, index) => (
                            <div key={index}>
                                <span className="activityDate">{new Date(entry.updatedAt || entry.createdAt).toLocaleDateString()}</span>
                                <span className="entry-label">
                                    {entry.type}: {entry.name || entry.investmentType.name || ""}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
