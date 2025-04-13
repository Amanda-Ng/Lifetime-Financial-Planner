const request = require("supertest");
const app = require("../server");
const User = require("../models/User"); // Import your User model
const mongoose = require("mongoose");

beforeAll(async () => {
    // Start an in-memory MongoDB server
    const mongodb = "mongodb://127.0.0.1:27017/citrifi-db";
    // Connect to the in-memory database
    await mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
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
            .post("/api/investmentTypes")
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
            .post("/api/investmentTypes")
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
            .post("/api/investments")
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
            .post("/api/investments")
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

        const response = await request(app).get(`/api/federalTaxes?year=${year}`).expect(200);
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

        const response = await request(app).get(`/api/federalTaxes?year=${year}`).expect(500);

        // Validate the error message
        expect(response.body).toHaveProperty("message", "Failed to fetch tax data");
    });
});
