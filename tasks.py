import inspect
import os
import re
import sys
from enum import Enum
from typing import Optional

import invoke
from invoke import task

# Specifying encoding because Windows crashes otherwise when running Invoke
# tasks below:
# UnicodeEncodeError: 'charmap' codec can't encode character '\ufffd'
# in position 16: character maps to <undefined>
# People say, it might also be possible to export PYTHONIOENCODING=utf8 but this
# seems to work.
# FIXME: If you are a Windows user and expert, please advise on how to do this
# properly.
sys.stdout = open(  # pylint: disable=consider-using-with
    1, "w", encoding="utf-8", closefd=False, buffering=1
)


def run_invoke(
    context,
    cmd,
    environment: Optional[dict] = None,
    warn: bool = False,
) -> invoke.runners.Result:
    def one_line_command(string):
        return re.sub("\\s+", " ", string).strip()

    return context.run(
        one_line_command(cmd),
        env=environment,
        hide=False,
        warn=warn,
        pty=False,
        echo=True,
    )


@task
def bootstrap(context):
    run_invoke(context, "pip install -r requirements.txt")


@task
def build(context):
    run_invoke(context, "npm run build")


@task
def format_readme(context):
    run_invoke(context, """
    prettier
        --write --print-width 80 --prose-wrap always --parser=markdown
        README.md
    """)


@task
def server(context):
    run_invoke(context, "npm run test_server")


@task
def test_unit(context):
    run_invoke(context, "npm run test")


@task(build)
def test_end2end_generate(
    context,
):
    run_invoke(context, """
        PYTHONPATH=.
        python test/random_test/random_test_generator.py dist/bundle.js
    """)


@task(build, aliases=["te"])
def test_end2end(
    context,
    focus=None,
    exit_first=False,
    parallelize=False,
    long_timeouts=False,
    silent=False,
    q=False,
    headless=False,
    headless2=False,
    headed=False,
):
    long_timeouts_argument = (
        "--strictdoc-long-timeouts" if long_timeouts else ""
    )

    parallelize_argument = ""
    if parallelize:
        print(  # noqa: T201
            "warning: "
            "Running parallelized end-2-end tests is supported "
            "but is not stable."
        )
        parallelize_argument = "--numprocesses=2 --strictdoc-parallelize"

    focus_argument = f"-k {focus}" if focus is not None else ""
    exit_first_argument = "--exitfirst" if exit_first else ""
    quiet_requested = silent or q
    silent_argument = "-q" if quiet_requested else ""

    head_modes = [headless, headless2, headed]
    if sum(1 for mode in head_modes if mode) > 1:
        raise ValueError("Choose at most one of --headless/--headless2/--headed")

    head_mode_argument = ""
    if headless:
        head_mode_argument = "--headless"
    elif headless2:
        head_mode_argument = "--headless2"
    elif headed:
        head_mode_argument = "--headed"

    # The option --log-cdp enables console logs by setting:
    # ("goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"})
    # This is needed for driver.get_log("browser") to work.
    # See our helper get_all_console_logs().

    test_command = f"""
        pytest
            --failed-first
            --capture=no
            --reuse-session
            --log-cdp
            {parallelize_argument}
            {focus_argument}
            {exit_first_argument}
            {silent_argument}
            {head_mode_argument}
            {long_timeouts_argument}
            test/end2end
    """

    run_invoke(context, test_command)


@task(build, test_end2end_generate)
def test_end2end_random(
    context,
    focus=None,
    exit_first=False,
    parallelize=False,
    long_timeouts=False,
    silent=False,
    q=False,
    headless=False,
    headless2=False,
    headed=False,
):
    long_timeouts_argument = (
        "--strictdoc-long-timeouts" if long_timeouts else ""
    )

    parallelize_argument = ""
    if parallelize:
        print(  # noqa: T201
            "warning: "
            "Running parallelized end-2-end tests is supported "
            "but is not stable."
        )
        parallelize_argument = "--numprocesses=2 --strictdoc-parallelize"

    focus_argument = f"-k {focus}" if focus is not None else ""
    exit_first_argument = "--exitfirst" if exit_first else ""
    quiet_requested = silent or q
    silent_argument = "-q" if quiet_requested else ""

    head_modes = [headless, headless2, headed]
    if sum(1 for mode in head_modes if mode) > 1:
        raise ValueError("Choose at most one of --headless/--headless2/--headed")

    head_mode_argument = ""
    if headless:
        head_mode_argument = "--headless"
    elif headless2:
        head_mode_argument = "--headless2"
    elif headed:
        head_mode_argument = "--headed"

    test_command = f"""
        PYTHONPATH=.
        pytest
            --failed-first
            --capture=no
            --reuse-session
            {parallelize_argument}
            {focus_argument}
            {exit_first_argument}
            {silent_argument}
            {head_mode_argument}
            {long_timeouts_argument}
            test/random_test/output
    """

    run_invoke(context, test_command)


@task(aliases=["t"])
def test(context):
    test_unit(context)
    test_end2end(context)
