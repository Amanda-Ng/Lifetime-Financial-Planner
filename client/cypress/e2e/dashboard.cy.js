// TP Copilot Prompt: "Can you create tests for the dashboard?"

describe('Dashboard Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET requests for dashboard data
        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 200,
            body: { username: 'testuser' },
        }).as('getUserProfile');

        cy.intercept('GET', '/auth/api/getUserInvestments', {
            statusCode: 200,
            body: [
                { _id: 'investment1', investmentType: { name: 'Stocks' } },
                { _id: 'investment2', investmentType: { name: 'Bonds' } },
            ],
        }).as('getUserInvestments');

        cy.intercept('GET', '/auth/api/getUserEvents', {
            statusCode: 200,
            body: [
                { _id: 'event1', name: 'Wedding' },
                { _id: 'event2', name: 'Vacation' },
            ],
        }).as('getUserEvents');

        cy.intercept('GET', '/auth/api/scenarios/editable', {
            statusCode: 200,
            body: [
                { _id: 'editable1', name: 'Retirement Plan' },
            ],
        }).as('getEditableScenarios');

        cy.intercept('GET', '/auth/api/scenarios/readonly', {
            statusCode: 200,
            body: [
                { _id: 'readonly1', name: 'Emergency Fund' },
            ],
        }).as('getReadOnlyScenarios');

        // Navigate to the Dashboard page
        cy.visit('http://localhost:3000');
    });

    it('should fetch and display dashboard data', () => {
        // Wait for all API calls to complete
        cy.wait('@getUserProfile');
        cy.wait('@getUserInvestments');
        cy.wait('@getUserEvents');
        cy.wait('@getEditableScenarios');
        cy.wait('@getReadOnlyScenarios');

        // Verify user name is displayed
        cy.contains("testuser's Dashboard").should('exist');

        // Verify investments section
        cy.contains('2 Investments').should('exist');
        cy.contains('Stocks').should('exist');
        cy.contains('Bonds').should('exist');

        // Verify events section
        cy.contains('2 Event Series').should('exist');
        cy.contains('Wedding').should('exist');
        cy.contains('Vacation').should('exist');

        // Verify scenarios section
        cy.contains('2 Scenarios').should('exist');
        cy.contains('Retirement Plan').should('exist');
        cy.contains('Emergency Fund').should('exist');
    });

    it('should navigate to the investment creation page', () => {
        cy.contains('➕ Create New Investment').click();
        cy.url().should('include', '/investment');
    });

    it('should navigate to the event creation page', () => {
        cy.contains('➕ Create New Event Series').click();
        cy.url().should('include', '/event');
    });

    it('should navigate to the events page when clicking on the events header', () => {
        cy.contains('2 Event Series').click();
        cy.url().should('include', '/eventsPage');
    });

    it('should navigate to the scenarios page when clicking on the scenarios header', () => {
        cy.contains('2 Scenarios').click();
        cy.url().should('include', '/scenario');
    });
});