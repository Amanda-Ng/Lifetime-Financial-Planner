// TP Copilot Prompt: "Can you create tests for the scenarios page?"

describe('Scenarios Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET requests for editable and read-only scenarios
        cy.intercept('GET', '/auth/api/scenarios/editable', {
            statusCode: 200,
            body: [
                { _id: 'editable1', name: 'Retirement Plan' },
                { _id: 'editable2', name: 'Vacation Plan' },
            ],
        }).as('getEditableScenarios');

        cy.intercept('GET', '/auth/api/scenarios/readonly', {
            statusCode: 200,
            body: [
                { _id: 'readonly1', name: 'Shared Emergency Fund' },
            ],
        }).as('getReadOnlyScenarios');

        // Navigate to the Scenarios page
        cy.visit('http://localhost:3000/scenario');
    });

    it('should fetch and display editable and read-only scenarios', () => {
        // Wait for the API calls to complete
        cy.wait('@getEditableScenarios');
        cy.wait('@getReadOnlyScenarios');

        // Verify editable scenarios are displayed
        cy.contains('My Editable Scenarios').should('exist');
        cy.contains('Retirement Plan').should('exist');
        cy.contains('Vacation Plan').should('exist');

        // Verify read-only scenarios are displayed
        cy.contains('Read-Only Scenarios Shared With Me').should('exist');
        cy.contains('Shared Emergency Fund').should('exist');
    });

    it('should navigate to the scenario creation page', () => {
        cy.contains('Create New Scenario').click();
        cy.url().should('include', '/scenarioForm');
    });

    it('should export a scenario', () => {
        // Stub the export API call
        cy.intercept('GET', '/api/scenarios/export/editable1', {
            statusCode: 200,
            body: new Blob(['mocked yaml content'], { type: 'application/x-yaml' }),
        }).as('exportScenario');

        // Click the export button for the first editable scenario
        cy.contains('Retirement Plan').parent().find('.export-button').click();

        // Verify the export API call was made
        cy.wait('@exportScenario').its('response.statusCode').should('eq', 200);
    });

    it('should handle API errors gracefully', () => {
        // Intercept API GET request for editable scenarios with an error response
        cy.intercept('GET', '/auth/api/scenarios/editable', {
            statusCode: 500,
            body: { message: 'Internal Server Error' },
        }).as('getEditableScenariosError');

        // Reload the page
        cy.visit('http://localhost:3000/scenario');
        cy.wait('@getEditableScenariosError');

        // Verify that an error message is logged in the console
        cy.window().then((win) => {
            cy.stub(win.console, 'error').as('consoleError');
        });
        cy.get('@consoleError').should('be.calledWithMatch', 'Error fetching scenarios:');
    });
});