const request = require("supertest");
const app = require("../server");
const User = require("../models/User"); // Import your User model
const Investment = require("../models/Investment");
const EventSeries = require("../models/EventSeries");
const Scenario = require("../models/Scenario");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

let token;
beforeAll(async () => {
    // Start an in-memory MongoDB server
    const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
    // Connect to the in-memory database
    await mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });

    // Generate a mock JWT token
    token = jwt.sign({ userId: "Guest" }, "secretKey");
});

afterAll(async () => {
    // Disconnect and stop the in-memory database
    await mongoose.disconnect();
});

afterEach(async () => {
    // Clear the database after each test
    await User.deleteMany({});
});

describe("POST /api/investmentTypes", () => {
    it("should create a new InvestmentType", async () => {
        const response = await request(app)
            .post("/auth/api/investmentTypes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Stocks",
                description: "Equity investments",
                returnType: "fixedAmount",
                incomeType: "randomAmount",
                expected_annual_return: 5.4,
                expected_annual_income: 10.2,
                expense_ratio: 0.1,
                taxability: "Taxable",
            })
            .expect(201);
        expect(response.body).toHaveProperty("name", "Stocks");
        expect(response.body).toHaveProperty("description", "Equity investments");
    });

    it("should create an InvestmentType with missing fields", async () => {
        const response = await request(app)
            .post("/auth/api/investmentTypes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                description: "Funding from banks",
                returnType: "fixedPercentage",
                incomeType: "fixedAmount",
                expected_annual_return: 3,
                expected_annual_income: 7.2,
            })
            .expect(500);
        expect(response.body).toHaveProperty("message");
    });
});

describe("POST /api/investments", () => {
    it("should create a new Investment", async () => {
        const response = await request(app)
            .post("/auth/api/investments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                investmentType: "60d21b4667d0d8992e610c85",
                value: 10000.0,
                tax_status: "Taxable",
                userId: "Guest",
            })
            .expect(201);

        expect(response.body).toHaveProperty("investmentType", "60d21b4667d0d8992e610c85");
        expect(response.body).toHaveProperty("userId", "Guest");
    });

    it("should fail to create an Investment with missing fields", async () => {
        const response = await request(app)
            .post("/auth/api/investments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                value: 10000,
            })
            .expect(400);

        expect(response.body).toHaveProperty("message");
    });
});

describe("GET /api/federalTaxes", () => {
    it("should fetch federal taxes for a specific year", async () => {
        const year = 2024;

        const response = await request(app).get(`/api/federalTaxes?year=${year}`).set("Authorization", `Bearer ${token}`).expect(200);
        // Validate the response
        expect(response.body).toHaveProperty("year", year);
        expect(response.body).toHaveProperty("single_federal_income_tax");
        expect(response.body).toHaveProperty("married_federal_income_tax");
        expect(response.body).toHaveProperty("single_standard_deductions");
        expect(response.body).toHaveProperty("married_standard_deductions");
        expect(response.body).toHaveProperty("single_capital_gains_tax");
        expect(response.body).toHaveProperty("married_capital_gains_tax");
    });

    it("should return an error if the year is not found", async () => {
        const year = 9999;

        const response = await request(app).get(`/api/federalTaxes?year=${year}`).set("Authorization", `Bearer ${token}`).expect(500);

        // Validate the error message
        expect(response.body).toHaveProperty("message", "Failed to fetch tax data");
    });
});

describe("POST /api/event-series", () => {
    it("should create a new EventSeries", async () => {
        const response = await request(app)
            .post("/auth/api/event-series")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Wedding",
                description: "A grand wedding event",
                startYearType: "fixed",
                startYear: 2025,
                durationType: "fixed",
                duration: 1,
                eventType: "expense",
                userId: "Guest",
            })
            .expect(201);

        expect(response.body).toHaveProperty("message", "EventSeries created successfully");
        expect(response.body.eventSeries).toHaveProperty("name", "Wedding");
        expect(response.body.eventSeries).toHaveProperty("userId", "Guest");
    });

    it("should fail to create an EventSeries with missing fields", async () => {
        const response = await request(app)
            .post("/auth/api/event-series")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Wedding",
            })
            .expect(500);

        expect(response.body).toHaveProperty("error", "Internal server error");
    });
});

describe("POST /api/scenarioForm", () => {
    it("should create a new Scenario", async () => {
        const response = await request(app)
            .post("/auth/api/scenarioForm")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Retirement Plan",
                maritalStatus: "Single",
                birthYear: 1985,
                lifeExpectancy_value: 85,
                investmentList: [],
                events: [],
                inflation: 2.5,
                pre_contribLimit: 19500,
                after_contribLimit: 6000,
                spendingStrat: [],
                withdrawStrat: [],
                roth_conversion_strategy: [],
                rmd_strategy: [],
                financialGoal: 1000000,
                stateResidence: "California",
                read_only: [],
                read_write: [],
            })
            .expect(201);

        expect(response.body).toHaveProperty("name", "Retirement Plan");
        expect(response.body).toHaveProperty("marital_status", "Single");
        expect(response.body).toHaveProperty("birth_year", 1985);
        expect(response.body).toHaveProperty("userId", "Guest");
    });

    it("should fail to create a Scenario with missing required fields", async () => {
        const response = await request(app)
            .post("/auth/api/scenarioForm")
            .set("Authorization", `Bearer ${token}`)
            .send({
                maritalStatus: "Single",
            })
            .expect(400);

        expect(response.body).toHaveProperty("message");
    });
});
