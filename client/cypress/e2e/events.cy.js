describe('Events Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET request for getUserEvents
        cy.intercept('GET', '/auth/api/getUserEvents', {
            statusCode: 200,
            body: [
                { _id: 'event1', name: 'Wedding', eventType: 'expense' },
                { _id: 'event2', name: 'Salary', eventType: 'income' },
                { _id: 'event3', name: 'Stock Investment', eventType: 'invest' },
            ],
        }).as('getUserEvents');

        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 200,
            body: { username: 'testuser' },
        }).as('getUserProfile');

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

        cy.intercept('GET', '/auth/api/scenarios/editable', {
            statusCode: 200,
            body: [
                { _id: 'editable1', name: 'Editable Scenario 1' },
                { _id: 'editable2', name: 'Editable Scenario 2' }
            ]
        }).as('getEditableScenarios');

        cy.intercept('GET', '/auth/api/scenarios/readonly', {
            statusCode: 200,
            body: [
                { _id: 'readonly1', name: 'Read-Only Scenario 1' }
            ]
        }).as('getReadOnlyScenarios');

        // Navigate to the Events page
        cy.visit('http://localhost:3000/eventsPage');
    });

    it('should fetch and display event series', () => {
        // Wait for the API call to complete
        cy.wait('@getUserEvents');

        // Verify that the event series are displayed
        cy.get('.event-card').should('have.length', 3);
        cy.contains('💸 Wedding').should('exist');
        cy.contains('💰 Salary').should('exist');
        cy.contains('📈 Stock Investment').should('exist');
    });

    it('should handle API errors gracefully', () => {
        // Intercept API GET request with an error response
        cy.intercept('GET', '/auth/api/getUserEvents', {
            statusCode: 500,
            body: { message: 'Internal Server Error' },
        }).as('getUserEventsError');

        // Reload the page
        cy.visit('http://localhost:3000/eventsPage');
        cy.wait('@getUserEventsError');

        // Verify that an error message is logged in the console
        cy.window().then((win) => {
            cy.stub(win.console, 'error').as('consoleError');
        });
        cy.get('@consoleError').should('be.calledWithMatch', 'Error fetching event series:');
    });
});