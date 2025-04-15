// cypress/e2e/scenario-form.cy.js

describe('Scenario Form', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET requests for getUserInvestments and getUserEvents
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

        cy.intercept('GET', '/auth/api/getUserEvents', {
            statusCode: 200,
            body: [
                { _id: 'event1', name: 'Wedding', isDiscretionary: true },
                { _id: 'event2', name: 'Vacation', isDiscretionary: true },
                { _id: 'event3', name: 'Medical Expense', isDiscretionary: false },
            ],
        }).as('getUserEvents');

        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 200,
            body: { username: 'testuser' },
        }).as('getUserProfile');

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

        // Navigate to the Scenario Form page
        cy.visit('http://localhost:3000/scenarioForm');
    });

    it('should validate required fields and submit the form', () => {
        // Attempt to submit without filling required fields
        cy.get('button[type="submit"]').click();
        cy.get('input[name="name"]').then(($input) => {
            expect($input[0].validationMessage).to.equal('Please fill out this field.');
        });

        // Fill required fields
        cy.get('input[name="name"]').type('Retirement Plan');
        cy.get('input[name="birthYear"]').type('1980');
        cy.get('input[name="financialGoal"]').type('1000000');
        cy.get('input[name="stateResidence"]').type('California');
        cy.get('input[name="inflation"]').type('2');
        cy.get('input[name="pre_contribLimit"]').type('19500');
        cy.get('input[name="after_contribLimit"]').type('6000');

        // Submit the form
        cy.get('button[type="submit"]').click();

        // Verify success alert
        cy.on('window:alert', (alertText) => {
            expect(alertText).to.equal('Scenario added successfully!');
        });
    });
});
