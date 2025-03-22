const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
    if (db) {
        db.close()
            .then(() => console.log("Database connection closed"))
            .catch((error) => console.log(error));
    }
    console.log("Process terminated");
});
