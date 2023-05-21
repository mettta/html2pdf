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


@task
def format_readme(context):
    run_invoke(context, """
    prettier
        --write --print-width 80 --prose-wrap always --parser=markdown
        README.md
    """)


@task
def test_unit(context):
    run_invoke(context, "npm run test")


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
            test/end2end
    """

    run_invoke(context, test_command)


@task
def test_integration(
    context,
    focus=None,
    debug=False,
):
    clean_itest_artifacts(context)

    cwd = os.getcwd()

    html2pdf_exec = f'python3 \\"{cwd}/html2pdf.py\\"'

    focus_or_none = f"--filter {focus}" if focus else ""
    debug_opts = "-vv --show-all" if debug else ""

    itest_command = f"""
        lit
        --param HTML2PDF_EXEC="{html2pdf_exec}"
        -v
        {debug_opts}
        {focus_or_none}
        {cwd}/test/python
    """

    # It looks like LIT does not open the RUN: subprocesses in the same
    # environment from which it itself is run from. This issue has been known by
    # us for a couple of years by now. Not using Tox on Windows for the time
    # being.
    if os.name == "nt":
        run_invoke(context, itest_command)
        return

    run_invoke(context, itest_command)


@task
def test(context):
    test_unit(context)
    test_integration(context)
    test_end2end(context)


@task
def clean_itest_artifacts(context):
    # https://unix.stackexchange.com/a/689930/77389
    find_command = """
        git clean -dfX tests/python/
    """
    # The command sometimes exits with 1 even if the files are deleted.
    # warn=True ensures that the execution continues.
    run_invoke(context, find_command, warn=True)
