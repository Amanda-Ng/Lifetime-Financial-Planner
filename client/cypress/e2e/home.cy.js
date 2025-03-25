// TP Copilot Prompt: "Can you create tests for the home page based on home.js?"


describe('Home Page', () => {
  beforeEach(() => {
    // Mock login and set token in localStorage
    cy.visit('http://localhost:3000/home');
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mocked-token');
    });

    // Intercept API GET request for isAuthenticated
    cy.intercept('GET', '/auth/isAuthenticated', {
      statusCode: 200,
      body: { user: { username: 'mocked-user' } },
    }).as('getIsAuthenticated');

    // Intercept API POST requests to prevent 401 errors
    cy.intercept('POST', '/auth/updateAge', {
      statusCode: 200,
      body: { message: 'Age updated successfully!' },
    }).as('postUpdateAge');
  });

  it('should display the age modal and handle age submission correctly', () => {
    // Check if the age modal is visible
    cy.contains('Please Enter Your Age').should('be.visible');

    // Enter a valid age and submit
    cy.get('input.age_input').clear().type('25');
    cy.contains('Submit').click();

    // Verify the modal is closed
    cy.contains('Please Enter Your Age').should('not.exist');

    // Verify the POST request was made with the correct data
    cy.wait('@postUpdateAge').its('request.body').should('deep.equal', { age: '25' });
  });
});
