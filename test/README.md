# README: Setup and Run Tests for the Project

## Test Configuration

### General Approach
We use **Mocha** as the main testing tool with support for ES modules (`"type": "module"`) in `package.json`. Tests are categorized into **unit**, **integration**, and **end-to-end**, with separate configurations for each type.


## Mocha Configuration

Separate configuration files are created for each test category:

- .mocharc.unit.json
- .mocharc.integration.json
- .mocharc.default.json (default for all tests)

## Key Files and Configurations

1. **package.json**

Scripts to run tests:

```json
"scripts": {
  "test": "mocha --config .mocharc.default.json",
  "test:unit": "mocha --config .mocharc.unit.json",
  "test:integration": "mocha --config .mocharc.integration.json"
}
```

2. **mocks/configMock.js**
Used for testing modules with predefined configurations

3. **ES Module Support**
The project is configured to use ES modules:

- `"type": "module"` is added to package.json.
- All imports include explicit `.js` extensions.
- Webpack configurations (webpack.common.js, webpack.dev.js, webpack.prod.js) are converted to ES modules.

## Running Tests
1.	**Run all tests:**
```bash
npm run test
```
2.	**Unit tests:**
```bash
npm run test:unit
```
3.	**Integration tests:**
```bash
npm run test:integration
```

## Additional Steps

**Adding New Tests:**
Ensure file names follow the `*.test.js` pattern for automatic discovery.

**Debugging:**
- If a test does not run, ensure its name matches the pattern in the Mocha configuration.
- Use `this.timeout()` in the test body for long-running tests.
