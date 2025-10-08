import os
import sys

import pytest

import builtins
builtins.focus = pytest.mark.focus

STRICTDOC_PATH = os.path.abspath(os.path.join(__file__, "../../.."))
assert os.path.exists(STRICTDOC_PATH), f"does not exist: {STRICTDOC_PATH}"
sys.path.append(STRICTDOC_PATH)

TESTS_TOTAL = 0


def pytest_addoption(parser):
    # pass
    parser.addoption("--no-focus", action="store_true", help="Ignore @pytest.mark.focus")


def pytest_configure(config):
    # pass
    config.addinivalue_line("markers", "focus: run only focused tests")


def pytest_collection_modifyitems(config, items):
    # Force ignore focus: RUN_ALL=1 or --no-focus
    if config.getoption("--no-focus", default=False) or os.getenv("RUN_ALL") == "1":
        return

    focused = [it for it in items if it.get_closest_marker("focus")]
    if focused:
        # Show that the rest of the tests are filtered (-rs in the output)
        deselected = [it for it in items if it not in focused]
        items[:] = focused
        config.hook.pytest_deselected(items=deselected)


# How to get the count of tests collected?
# https://stackoverflow.com/a/66515819/598057
def pytest_runtestloop(session):
    global TESTS_TOTAL  # pylint: disable=global-statement
    TESTS_TOTAL = len(session.items)


TEST_COUNTER = 0


@pytest.fixture(autouse=True)
def run_around_tests():
    global TEST_COUNTER  # pylint: disable=global-statement
    TEST_COUNTER += 1
    print(f"-> Test {TEST_COUNTER}/{TESTS_TOTAL}")  # noqa: T201
    yield
