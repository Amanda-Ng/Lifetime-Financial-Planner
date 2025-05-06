describe('Simulations Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API requests for simulations
        cy.intercept('GET', '/auth/api/scenarios/editable', {
            statusCode: 200,
            body: [
                { _id: "60d5ec49f8d2c45b8a3f0abc", name: 'Retirement Plan', financial_goal: 10000 },
                { _id: "60d5ec49f8d2c45b8a4f0abc", name: 'Vacation Plan', financial_goal: 5000 },
            ],
        }).as('getEditableScenarios');

        cy.intercept('GET', '/auth/api/scenarios/readonly', {
            statusCode: 200,
            body: [
                { _id: 'readonly1', name: 'Shared Emergency Fund', financial_goal: 2000 },
            ],
        }).as('getReadOnlyScenarios');

        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 200,
            body: { username: 'testuser' },
        }).as('getProfile');

        cy.intercept('POST', '/auth/api/runAllSimulations', {
            statusCode: 200,
            body: {
                successProbability: [
                    { year: 2025, probability: 75 },
                    { year: 2026, probability: 80 },
                    { year: 2027, probability: 85 },
                ],
                shadedChartData: {
                    totalInvestments: [
                        { year: 2025, median: 5000, ranges: { "10-90": [4000, 6000] } },
                        { year: 2026, median: 7000, ranges: { "10-90": [6000, 8000] } },
                        { year: 2027, median: 9000, ranges: { "10-90": [8000, 10000] } },
                    ],
                },
                stackedChartData: [
                    { year: 2025, investments: [{ name: 'Stocks', value: 3000 }, { name: 'Bonds', value: 2000 }] },
                    { year: 2026, investments: [{ name: 'Stocks', value: 4000 }, { name: 'Bonds', value: 3000 }] },
                ],
            },
        }).as('runAllSimulations');

        // Navigate to the Simulations page
        cy.visit('http://localhost:3000/simulation');
    });

    it('should handle server error', () => {
        cy.request({
            method: 'POST',
            url: '/auth/api/runAllSimulations',
            body: {
                "scenarioId": "6817b6ea1b859bdbf27b1f64",
                "username": "TestUser",
                "numSimulations": 10,
                "stackedChartQuantity": "investments",
                "aggregationThreshold": 1000,
                "useMedian": true
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(404);
        });
    });

});