// TP Copilot Prompt: "Can you create tests for the investment form?"

describe('Investment Form', () => {
  beforeEach(() => {
    // Mock login and set token in localStorage
    cy.visit('http://localhost:3000/');
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mocked-token');
    });

    // Intercept API POST requests to prevent 401 errors
    cy.intercept('POST', '/auth/api/investmentTypes', {
      statusCode: 200,
      body: { _id: 'mocked-investment-type-id' },
    }).as('postInvestmentTypes');

    cy.intercept('POST', '/auth/api/investments', {
      statusCode: 200,
      body: { message: 'Investment added successfully!' },
    }).as('postInvestments');

    // Navigate to the Investment form page
    cy.visit('http://localhost:3000/investment');
  });

  it('should fill out and submit the investment form successfully', () => {
    // Fill out the form
    cy.get('input[name="name"]').type('Real Estate');
    cy.get('textarea[name="description"]').type('Investment in real estate properties.');
    cy.get('input[name="value"]').type('100000');

    // Select "Fixed Amount" return type and fill the textbox
    cy.get('input[name="returnType"][value="fixedAmount"]').check();
    cy.get('input[name="fixedReturnAmount"]').type('5000');

    // Select "Fixed Amount" income type and fill the textbox
    cy.get('input[name="incomeType"][value="fixedAmount"]').check();
    cy.get('input[name="fixedIncomeAmount"]').type('2000');

    cy.get('input[name="expenseRatio"]').type('1.5');
    cy.get('select[name="taxability"]').select('taxable');
    cy.get('select[name="taxStatus"]').select('non-retirement');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Listen for the alert and validate its message
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Investment added successfully!');
    });
  });

  it('should dynamically show and validate fields based on return type', () => {
    // Select "Fixed Amount" return type and validate
    cy.get('input[name="returnType"][value="fixedAmount"]').check();
    cy.get('input[name="fixedReturnAmount"]').should('be.visible').type('5000');

    // Select "Random Percentage" return type and validate
    cy.get('input[name="returnType"][value="randomPercentage"]').check();
    cy.get('input[name="meanReturnPercentage"]').should('be.visible').type('5');
    cy.get('input[name="stdDevReturnPercentage"]').should('be.visible').type('1');
  });

  it('should dynamically show and validate fields based on income type', () => {
    // Select "Fixed Amount" income type and validate
    cy.get('input[name="incomeType"][value="fixedAmount"]').check();
    cy.get('input[name="fixedIncomeAmount"]').should('be.visible').type('2000');

    // Select "Random Amount" income type and validate
    cy.get('input[name="incomeType"][value="randomAmount"]').check();
    cy.get('input[name="meanIncomeAmount"]').should('be.visible').type('1500');
    cy.get('input[name="stdDevIncomeAmount"]').should('be.visible').type('300');
  });

  it('should show browser-native validation popup for empty required fields', () => {
    // Attempt to submit the form without filling required fields
    cy.get('button[type="submit"]').click();

    // Validate the browser-native validation popup for the "Name" field
    cy.get('input[name="name"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });

    // Validate the browser-native validation popup for the "Value" field
    cy.get('input[name="value"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });

    // Validate the browser-native validation popup for the "Expense Ratio" field
    cy.get('input[name="expenseRatio"]').then(($input) => {
      expect($input[0].validationMessage).to.equal('Please fill out this field.');
    });
  });
});
