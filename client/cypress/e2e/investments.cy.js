// TP Copilot Prompt: "Can you create tests for the investments page?"

describe('Investments Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET request for getUserInvestments
        cy.intercept('GET', '/auth/api/getUserInvestments', {
            statusCode: 200,
            body: [
                {
                    _id: 'investment1',
                    investmentType: { name: 'Stocks' },
                    value: { $numberDecimal: '10000' },
                    tax_status: 'pre-tax retirement',
                },
                {
                    _id: 'investment2',
                    investmentType: { name: 'Bonds' },
                    value: { $numberDecimal: '5000' },
                    tax_status: 'taxable',
                },
            ],
        }).as('getUserInvestments');

        // Navigate to the Investments page
        cy.visit('http://localhost:3000/investmentPage');
    });

    it('should fetch and display investments', () => {
        // Wait for the API call to complete
        cy.wait('@getUserInvestments');

        // Verify that the investments are displayed
        cy.get('.investment-card').should('have.length', 2);
        cy.contains('💲Stocks').should('exist');
        cy.contains('Value: $10000').should('exist');
        cy.contains('Tax Status: pre-tax retirement').should('exist');

        cy.contains('💲Bonds').should('exist');
        cy.contains('Value: $5000').should('exist');
        cy.contains('Tax Status: taxable').should('exist');
    });

    it('should handle API errors gracefully', () => {
        // Intercept API GET request with an error response
        cy.intercept('GET', '/auth/api/getUserInvestments', {
            statusCode: 500,
            body: { message: 'Internal Server Error' },
        }).as('getUserInvestmentsError');

        // Reload the page
        cy.visit('http://localhost:3000/investmentPage');
        cy.wait('@getUserInvestmentsError');

        // Verify that an error message is logged in the console
        cy.window().then((win) => {
            cy.stub(win.console, 'error').as('consoleError');
        });
        cy.get('@consoleError').should('be.calledWithMatch', 'Error fetching investments:');
    });
});