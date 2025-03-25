// TP Copilot Prompt: "Can you create tests for the event form?"

describe('Event Form', () => {
  beforeEach(() => {
    // Mock login and set token in localStorage
    cy.visit('http://localhost:3000/');
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mocked-token');
    });

    // Intercept API GET request for isAuthenticated
    cy.intercept('GET', '/auth/isAuthenticated', {
      statusCode: 200,
      body: { user: { username: 'mocked-user' } },
    }).as('getIsAuthenticated');

    // Intercept API POST requests to prevent 401 errors
    cy.intercept('POST', '/auth/api/event-series', {
      statusCode: 200,
      body: { message: 'Event submitted successfully!' },
    }).as('postEventSeries');

    // Navigate to the Event form page
    cy.visit('http://localhost:3000/event');
  });

  it('should fill out and submit the event form successfully', () => {
    // Fill out the form
    cy.get('input[name="name"]').type('Annual Conference');
    cy.get('textarea[name="description"]').type('A yearly gathering of professionals.');
    cy.get('input[name="startYearType"][value="fixed"]').check();
    cy.get('input[name="startYear"]').type('2025');
    cy.get('input[name="durationType"][value="fixed"]').check();
    cy.get('input[name="duration"]').type('3');
    cy.get('select[name="eventType"]').select('income');
    cy.get('input[name="initialAmount"]').type('50000');
    cy.get('input[name="expectedChangeType"][value="fixedAmount"]').check();
    cy.get('input[name="expectedChangeAmount"]').type('2000');
    cy.get('input[name="inflationAdjustment"]').check();

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Listen for the alert and validate its message
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Event submitted successfully!');
    });
  });

  it('should dynamically show and hide fields based on user input', () => {
    // Select "normal" for startYearType and check for related fields
    cy.get('input[name="startYearType"][value="normal"]').check();
    cy.get('input[name="meanStartYear"]').should('be.visible').type('2025');
    cy.get('input[name="stdDevStartYear"]').should('be.visible').type('2');

    // Select "uniform" for durationType and check for related fields
    cy.get('input[name="durationType"][value="uniform"]').check();
    cy.get('input[name="minDuration"]').should('be.visible').type('1');
    cy.get('input[name="maxDuration"]').should('be.visible').type('5');

    // Select "expense" for eventType and check for related fields
    cy.get('select[name="eventType"]').select('expense');
    cy.get('input[name="initialAmount"]').should('be.visible').type('3000');
    cy.get('input[name="expectedChangeType"][value="fixedPercentage"]').check();
    cy.get('input[name="expectedChangePercentage"]').should('be.visible').type('5');
  });

  it('should show browser-native validation popup for empty required fields', () => {
    // Attempt to submit the form without filling required fields
    cy.get('button[type="submit"]').click();

    // Validate the browser-native validation popup for the "Name" field
    cy.get('input[name="name"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });

    // Validate the browser-native validation popup for the "Start Year" field
    cy.get('input[name="startYear"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });

    // Validate the browser-native validation popup for the "Duration" field
    cy.get('input[name="duration"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });
  });
});
