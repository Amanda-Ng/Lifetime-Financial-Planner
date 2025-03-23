const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
require('./passport/passport');
const passport = require('passport');
const configs = require('./configs/config.js');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
//

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(passport.initialize());

// const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
// mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(configs.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;
db.on("error", console.error.bind(console, "Error with MongoDB connection"));
db.once("open", () => console.log("Connected to MongoDB"));


// Auth routes
// TP: Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
app.use('/auth', require('./routes/auth'));
//

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
