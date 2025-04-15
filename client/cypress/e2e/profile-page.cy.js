// TP Copilot Prompt: "Can you create tests for the profile page?"

describe('Profile Page', () => {
    beforeEach(() => {
        // Mock login and set token in localStorage
        cy.visit('http://localhost:3000/');
        cy.window().then((win) => {
            win.localStorage.setItem('token', 'mocked-token');
        });

        // Intercept API GET requests for user profile and activity
        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 200,
            body: {
                username: 'testuser',
                email: 'testuser@example.com',
            },
        }).as('getUserProfile');

        cy.intercept('GET', '/auth/api/users/activity', {
            statusCode: 200,
            body: [
                {
                    updatedAt: '2025-04-10T12:00:00Z',
                    type: 'Investment',
                    name: 'Stocks',
                },
                {
                    createdAt: '2025-04-09T10:00:00Z',
                    type: 'Event',
                    name: 'Wedding',
                },
            ],
        }).as('getUserActivity');

        // Navigate to the Profile page
        cy.visit('http://localhost:3000/profile');
    });

    it('should fetch and display user profile information', () => {
        // Wait for the API call to complete
        cy.wait('@getUserProfile');

        // Verify user profile information is displayed
        cy.contains('testuser').should('exist');
        cy.contains('testuser@example.com').should('exist');
    });

    it('should toggle the edit profile form', () => {
        // Verify the edit form is not visible initially
        cy.contains('UPDATE INFO >').should('exist');

        // Click the update info button to show the form
        cy.contains('UPDATE INFO >').click();
        cy.contains('CANCEL').should('exist');
        cy.get('form').should('exist');

        // Click the cancel button to hide the form
        cy.contains('CANCEL').click();
        cy.contains('UPDATE INFO >').should('exist');
    });

    it('should log the user out', () => {
        // Click the logout link
        cy.contains('Logout').click();

        // Verify the user is redirected to the login page
        cy.url().should('include', '/login');
    });

    it('should handle API errors gracefully', () => {
        // Intercept API GET request for user profile with an error response
        cy.intercept('GET', '/auth/api/profile', {
            statusCode: 500,
            body: { message: 'Internal Server Error' },
        }).as('getUserProfileError');

        // Reload the page
        cy.visit('http://localhost:3000/profile');
        cy.wait('@getUserProfileError');

        // Verify that an error message is logged in the console
        cy.window().then((win) => {
            cy.stub(win.console, 'error').as('consoleError');
        });
        cy.get('@consoleError').should('be.calledWithMatch', 'Error fetching user profile:');
    });
});