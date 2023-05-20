import os
import sys

import pytest

STRICTDOC_PATH = os.path.abspath(os.path.join(__file__, "../../.."))
assert os.path.exists(STRICTDOC_PATH), f"does not exist: {STRICTDOC_PATH}"
sys.path.append(STRICTDOC_PATH)

TESTS_TOTAL = 0


def pytest_addoption(parser):
    pass


def pytest_configure(config):
    pass


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
