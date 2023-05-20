# Invoke is broken on Python 3.11
# https://github.com/pyinvoke/invoke/issues/833#issuecomment-1293148106
import inspect
import os
import re
import sys
from enum import Enum
from typing import Optional

if not hasattr(inspect, "getargspec"):
    inspect.getargspec = inspect.getfullargspec

import invoke  # pylint: disable=wrong-import-position
from invoke import task  # pylint: disable=wrong-import-position

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
def build(context):
    run_invoke(context, "npm run build")


@task(build)
def test_end2end(
    context,
    focus=None,
    exit_first=False,
    parallelize=False,
    long_timeouts=False,
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

    test_command = f"""
        pytest
            --failed-first
            --capture=no
            --reuse-session
            {parallelize_argument}
            {focus_argument}
            {exit_first_argument}
            {long_timeouts_argument}
            tests/end2end
    """

    run_invoke(context, test_command)
