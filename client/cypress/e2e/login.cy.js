// TP Copilot Prompt: "how do I use cypress to make tests?"

describe('Login Flow', () => {
  it('should log in and redirect to /success', () => {
    // Visit the login page
    cy.visit('http://localhost:3000/');

    // Simulate clicking the Google login button
    cy.contains('Continue with Google').click();

    // Mock the backend redirect to /success with a token
    cy.visit('http://localhost:3000/success?token=mocked-token');

    // Verify that the token is stored in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.equal('mocked-token');
    });

    // Verify redirection to /home
    cy.url().should('include', '/home');
  });
});
