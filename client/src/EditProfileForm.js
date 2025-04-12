import React, { useState } from "react";
import { axiosClient } from "./services/apiClient";
import "./EditProfileForm.css";

export default function EditProfileForm({ userData }) {

    console.log('userData: ', userData);
    const [formData, setFormData] = useState({
        username: userData.username || "",
        age: userData.age || "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.put("/api/users/update", formData);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    return (
        <form className="edit-profile-form" onSubmit={handleSubmit}>
            <h2>Edit Profile Info</h2>

            <div className="form-group">
                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Age</label>
                <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit" className="submit-btn">Save Changes</button>
        </form>
    );
}
