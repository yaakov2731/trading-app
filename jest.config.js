module.exports = {
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/calculator.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'dom',
      testMatch: ['<rootDir>/ui.test.js'],
      testEnvironment: 'jsdom'
    }
  ]
};
