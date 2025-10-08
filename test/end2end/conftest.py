import os
import sys
from html.parser import HTMLParser

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
FAILED_HTML_DUMPS_CALL_STAGE = {}

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
LATEST_LOGS_DIR = os.path.join(REPO_ROOT, "latest_logs")
MAX_HTML_CHARS = 8000
HTML_FRAGMENT_MODE_DEFAULT = "body"
HTML_FRAGMENT_MODE = os.getenv("E2E_HTML_FRAGMENT_MODE", HTML_FRAGMENT_MODE_DEFAULT)
print(f"[debug] HTML fragment mode at import: {HTML_FRAGMENT_MODE}", flush=True)


@pytest.fixture(autouse=True)
def run_around_tests():
    global TEST_COUNTER  # pylint: disable=global-statement
    TEST_COUNTER += 1
    print(f"-> Test {TEST_COUNTER}/{TESTS_TOTAL}")  # noqa: T201
    yield


@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_call(item):
    outcome = yield
    if outcome.excinfo is not None:
        # Capture the DOM before SeleniumBase tears the driver down.
        FAILED_HTML_DUMPS_CALL_STAGE[item.nodeid] = _capture_page_source(item)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when != "call" or not report.failed:
        return

    page_source = FAILED_HTML_DUMPS_CALL_STAGE.pop(item.nodeid, None)
    if page_source is None:
        page_source = _capture_page_source(item)

    snippet, truncated = _prepare_html_output(page_source)

    longrepr = getattr(report, "longrepr", None)
    if hasattr(longrepr, "addsection"):
        longrepr.addsection("HTML page source", snippet)
        if truncated:
            longrepr.addsection(
                "HTML page source note",
                f"Truncated to {MAX_HTML_CHARS} characters; full DOM saved in latest_logs.",
            )
    else:
        sections = getattr(report, "sections", None)
        if sections is not None:
            sections.append(("HTML page source", snippet))
            if truncated:
                sections.append(
                    (
                        "HTML page source note",
                        f"Truncated to {MAX_HTML_CHARS} characters; full DOM saved in latest_logs.",
                    )
                )
        elif isinstance(report.longrepr, str):
            report.longrepr += (
                f"\n\nHTML page source (truncated):\n{snippet}"
                if truncated
                else f"\n\nHTML page source:\n{snippet}"
            )
            if truncated:
                report.longrepr += (
                    f"\n[Truncated to {MAX_HTML_CHARS} characters; full DOM saved in latest_logs]"
                )


def _capture_page_source(item):
    instance = getattr(item, "instance", None)
    if instance is None:
        return _fallback_latest_logs(item.nodeid, "<<no test instance>>")

    getter = getattr(instance, "get_page_source", None)
    if callable(getter):
        try:
            source = getter()
            if source:
                return source
            return _fallback_latest_logs(item.nodeid, "<<get_page_source() returned empty>>")
        except Exception as exc:  # pylint: disable=broad-except
            return _fallback_latest_logs(item.nodeid, f"<<get_page_source() failed: {exc}>>")

    driver = getattr(instance, "driver", None)
    if driver is None:
        return _fallback_latest_logs(item.nodeid, "<<no driver attribute>>")

    try:
        source = driver.page_source
        if source:
            return source
        return _fallback_latest_logs(item.nodeid, "<<driver.page_source returned empty>>")
    except Exception as exc:  # pylint: disable=broad-except
        return _fallback_latest_logs(item.nodeid, f"<<driver.page_source failed: {exc}>>")


def _fallback_latest_logs(nodeid: str, default_message: str) -> str:
    html = _read_latest_logs_page_source(nodeid)
    if html:
        return html
    return default_message


def _read_latest_logs_page_source(nodeid: str):
    if not os.path.isdir(LATEST_LOGS_DIR):
        return None

    candidate = _nodeid_to_latest_logs_dir(nodeid)
    if candidate is None:
        return None

    html_path = os.path.join(candidate, "page_source.html")
    if not os.path.isfile(html_path):
        return None

    try:
        with open(html_path, "r", encoding="utf-8") as file:
            return file.read()
    except UnicodeDecodeError:
        try:
            with open(html_path, "r", encoding="latin-1") as file:
                return file.read()
        except Exception:  # pylint: disable=broad-except
            return None
    except Exception:  # pylint: disable=broad-except
        return None


def _nodeid_to_latest_logs_dir(nodeid: str):
    if not nodeid:
        return None

    candidate_name = nodeid.replace("::", ".").replace("/", ".").replace("\\", ".")
    candidate_name = candidate_name.replace(".py", "")

    candidate_path = os.path.join(LATEST_LOGS_DIR, candidate_name)
    if os.path.isdir(candidate_path):
        return candidate_path

    # fallback: try replacing remaining path separators with dots aggressively
    candidate_name = "".join(
        "." if c in {"/", "\\"} else c for c in nodeid
    ).replace("::", ".")
    candidate_name = candidate_name.replace(".py", "")
    candidate_path = os.path.join(LATEST_LOGS_DIR, candidate_name)
    if os.path.isdir(candidate_path):
        return candidate_path

    return None


def _prepare_html_output(page_source: str):
    print(f"[debug] HTML fragment mode: {HTML_FRAGMENT_MODE}", flush=True)

    if not page_source:
        return "<<empty page source>>", False

    text = page_source.strip()
    if text.startswith("<<") and text.endswith(">>"):
        return text, False

    body = _extract_fragment(text)
    snippet = body if body else text
    snippet = snippet.strip()

    truncated = False
    if len(snippet) > MAX_HTML_CHARS:
        snippet = snippet[:MAX_HTML_CHARS]
        truncated = True

    return snippet, truncated


def _extract_fragment(html: str):
    mode = (HTML_FRAGMENT_MODE or "").strip()
    if not mode:
        mode = "body"

    lowered = mode.lower()

    if lowered == "body" or lowered == "main":
        return _extract_tag_fragment(html, lowered)

    if lowered.startswith("tag:"):
        tag = mode[4:].strip()
        if tag:
            return _extract_tag_fragment(html, tag)
        return None

    if lowered.startswith("attr:"):
        attr = mode[5:].strip()
        if attr:
            return _extract_attr_fragment(html, attr)
        return None

    return _extract_tag_fragment(html, "body")


def _extract_tag_fragment(html: str, tag_name: str):
    if not tag_name:
        return None

    tag_lower = tag_name.lower()
    lower = html.lower()

    start = lower.find(f"<{tag_lower}")
    if start == -1:
        return None

    start_tag_end = lower.find(">", start)
    if start_tag_end == -1:
        start_tag_end = start

    end = lower.find(f"</{tag_lower}", start_tag_end)
    if end == -1:
        return html[start:]

    closing_end = lower.find(">", end)
    if closing_end == -1:
        closing_end = end + len(f"</{tag_lower}>")
    else:
        closing_end += 1

    return html[start:closing_end]


def _extract_attr_fragment(html: str, attr_selector: str):
    attr_lower = attr_selector.lower()
    attr_value = None

    if "=" in attr_selector:
        name, value = attr_selector.split("=", 1)
        attr_lower = name.strip().lower()
        attr_value = value.strip().strip('"').strip("'")

    class _AttrCollector(HTMLParser):
        def __init__(self):
            super().__init__()
            self.depth = 0
            self.fragments = []

        def handle_starttag(self, tag, attrs):
            attr_present = any((name or "").lower() == attr_lower for name, _ in attrs)
            if attr_present and attr_value is not None:
                attr_present = any(
                    (name or "").lower() == attr_lower and value == attr_value
                    for name, value in attrs
                )
            if attr_present:
                self.depth += 1
            elif self.depth > 0:
                self.depth += 1

            if attr_present or self.depth > 0:
                attr_string = " ".join(
                    f'{name}="{value}"' if value is not None else f"{name}"
                    for name, value in attrs
                )
                self.fragments.append(
                    f"<{tag}{(' ' + attr_string) if attr_string else ''}>"
                )

        def handle_startendtag(self, tag, attrs):
            attr_present = any((name or "").lower() == attr_lower for name, _ in attrs)
            if attr_present and attr_value is not None:
                attr_present = any(
                    (name or "").lower() == attr_lower and value == attr_value
                    for name, value in attrs
                )
            if attr_present or self.depth > 0:
                attr_string = " ".join(
                    f'{name}="{value}"' if value is not None else f"{name}"
                    for name, value in attrs
                )
                self.fragments.append(
                    f"<{tag}{(' ' + attr_string) if attr_string else ''}/>"
                )

        def handle_endtag(self, tag):
            if self.depth > 0:
                self.fragments.append(f"</{tag}>")
                self.depth -= 1

        def handle_data(self, data):
            if self.depth > 0:
                self.fragments.append(data)

    parser = _AttrCollector()
    try:
        parser.feed(html)
        parser.close()
    except Exception:  # pylint: disable=broad-except
        return None

    fragment = "".join(parser.fragments)
    return fragment or None
