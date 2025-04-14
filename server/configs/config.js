// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications
const dotenv = require("dotenv");
dotenv.config();

const configs = {
    serverPort: process.env.PORT || 8000,
    dbURL: process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/citrifi-db",
    googleAuthClientId: process.env.GOOGLE_AUTH_CLIENT_ID,
    googleAuthClientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    googleAuthServerCallbackURL: process.env.GOOGLE_AUTH_SERVER_CALLBACK || "http://localhost:8000/auth/google/callback",
    googleAuthClientSuccessURL: process.env.GOOGLE_AUTH_CLIENT_URL_SUCCESS || "http://localhost:3000",
    federalIncomeTaxURL: process.env.FEDERAL_INCOME_TAX_URL,
    standardDeductionsURL: process.env.STANDARD_DEDUCTIONS_URL,
    capitalGainsTaxURL: process.env.CAPITAL_GAINS_TAX_URL,
};

module.exports = configs;
