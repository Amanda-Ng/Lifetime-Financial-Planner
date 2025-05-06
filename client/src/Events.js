import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "./services/apiClient";
import axios from "axios";
import "./Events.css";

function Events() {
    const [eventSeries, setEventSeries] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const headers = {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                };
                const event_response = await axiosClient.get('/api/getUserEvents', { headers });
                setEventSeries(event_response.data);
            } catch (error) {
                console.error("Error fetching event series:", error);
            }
        };

        fetchEvents();
    }, []);

    const getEventEmoji = (type) => {
        switch (type) {
            case "income":
                return "💰";
            case "expense":
                return "💸";
            case "invest":
                return "📈";
            case "rebalance":
                return "⚖️";
            default:
                return "📝";
        }
    };

    const deleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;

        try {
            await axios.delete(`http://localhost:8000/api/deleteEvent/${eventId}`);

            setEventSeries(prev => prev.filter(event => event._id !== eventId));
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    };

    return (
        <div id="events-container">
            <div className="events-header">
                <img src="add.png" alt="add_icon" className="big_icon" />
                <Link to="/event" className="subsub_header">Create New Event Series</Link>
            </div>

            <h3>My Event Series</h3>
            {eventSeries.map((event) => (
                <div key={event._id} className="event-card">
                    <div>
                        <span className="subsub_header">
                            {getEventEmoji(event.eventType)} {event.name}
                        </span>
                        <div className="event-details">
                            <span>Event Type: {event.eventType}</span>
                        </div>
                        <button className="delete-button" onClick={() => deleteEvent(event._id)}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Events;
