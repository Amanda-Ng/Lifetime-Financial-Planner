// TP Copilot Prompt: "how do I use cypress to make tests?"


describe('Age Modal', () => {
  it('should display the age modal and block navigation', () => {
    cy.visit('http://localhost:3000/home');

    // Verify that the modal is visible
    cy.get('.modal-overlay').should('be.visible');

    // Try to interact with the sidebar (should be blocked)
    cy.contains('Profile').should('not.exist');

    // Enter age and submit
    cy.get('input[type="number"]').type('18');
    cy.contains('Submit').click();

    // Verify that the modal is closed
    cy.get('.modal-overlay').should('not.exist');

    // Verify that the sidebar is now accessible
    cy.contains('Profile').should('exist');
  });

});
