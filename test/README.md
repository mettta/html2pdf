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

### 4. **Sinon for Spies, Stubs, and Mocks**
We use **Sinon** to mock, stub, and spy on dependencies in unit tests. It helps to:
- Replace real functions with controlled behavior (e.g., API calls).
- Verify function calls, arguments, and execution order.
- Mock time-based functions like `setTimeout`.

## Running Tests

### JavaScript Tests
#### Run all tests

```bash
npm run test
```

#### Unit tests

```bash
npm run test:unit
```

#### Integration tests:

```bash
npm run test:integration
```

### End-to-End tests (Python):

End-to-end (E2E) tests are written in Python and live outside the JavaScript test infrastructure.

#### Run all E2E tests

Run them using the Invoke CLI:

```bash
invoke test_end2end
```

Or using the short alias:

```bash
invoke te
```

#### Optional flags:

- `--focus=TableSplit` — run only matching test groups
- `--exit-first` — stop after the first failure
- `--long-timeouts` — increase allowed test durations
- `--parallelize` — run tests in parallel (if supported)

### Focusing on Selected Tests

You can temporarily limit E2E test runs to a single test (or a few) without renaming or deleting other tests.

1. Mark the desired test(s) with `@focus` shortcut:

   *(an alias exposed in `conftest.py`; no need to import `pytest`):*

   ```python
   @focus
   def test_only_this():
       ...
   ```

   Alternatively, you can still use the original pytest syntax:

   ```python
   import pytest
   @pytest.mark.focus
   def test_only_this():
   ...
   ```

2. **Default behavior:**

- If no tests are marked focus → all tests run as usual.
- If at least one test is marked focus → only the focused tests run; all others are skipped automatically.

3. **Overriding the filter:**

- To run **all** tests even *when some are marked focus*, set the environment variable:
    ```bash
    RUN_ALL=1 invoke te
    ```
  or pass the extra pytest flag:
    ```bash
    invoke te -- --no-focus
    ```

### Randomized Test Generation
For randomized test generation and execution:

```bash
invoke test_end2end_random
```

This will generate input data and run tests against the output folder.


## Additional Steps

**Adding New Tests:**
- For JavaScript tests, ensure file names follow the `*.test.js` pattern for automatic discovery by Mocha.
- For Python end-to-end tests, place new test files in the appropriate `test/end2end/` folder. These tests should follow standard `pytest` or `unittest` naming conventions (e.g. `test_*.py`).

**Debugging:**
- If a test does not run, ensure its name matches the pattern in the Mocha configuration.
- Use `this.timeout()` in the test body for long-running tests.
