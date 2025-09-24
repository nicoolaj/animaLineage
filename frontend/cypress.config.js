{
  "baseUrl": "http://localhost:3002",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "video": true,
  "screenshotOnRunFailure": true,
  "defaultCommandTimeout": 10000,
  "pageLoadTimeout": 30000,
  "requestTimeout": 10000,
  "responseTimeout": 10000,
  "retries": {
    "runMode": 2,
    "openMode": 0
  },
  "e2e": {
    "setupNodeEvents": function(on, config) {
      // implement node event listeners here
    },
    "supportFile": false,
    "specPattern": "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"
  },
  "env": {
    "apiUrl": "http://localhost:3001/api"
  }
}
