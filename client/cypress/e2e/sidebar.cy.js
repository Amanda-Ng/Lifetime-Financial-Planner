// TP Copilot Prompt: "how do I use cypress to make tests?"

describe('Sidebar Navigation', () => {
  beforeEach(() => {
    // Mock login and set token in localStorage
    cy.visit('http://localhost:3000/');
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mocked-token');
    });

    cy.visit('http://localhost:3000/');
  });

  it('should navigate to the Profile page', () => {
    cy.contains('Profile').click();
    cy.url().should('include', '/profile');
  });

  it('should navigate to the Dashboard page', () => {
    cy.contains('Dashboard').click();
    cy.url().should('include', '/');
  });

  it('should navigate to the Scenario page', () => {
    cy.contains('Scenario').click();
    cy.url().should('include', '/scenario');
  });

  it('should navigate to the Investment page', () => {
    cy.contains('Investment').click();
    cy.url().should('include', '/investment');
  });

  it('should navigate to the Event page', () => {
    cy.contains('Event').click();
    cy.url().should('include', '/event');
  });

  it('should navigate to the Simulation page', () => {
    cy.contains('Simulation').click();
    cy.url().should('include', '/simulation');
  });

  it('should logout', () => {
    cy.contains('Logout').click();
    cy.url().should('include', '/login');
  });
});
