import argparse
import os
import random
import shutil
from enum import Enum
from pathlib import Path

import dominate
from dominate.tags import *

PATH_TO_THIS_FOLDER = os.path.dirname(__file__)
PATH_TO_TEST_CASE = os.path.join(PATH_TO_THIS_FOLDER, "test_case.py")


class HTMLNode(Enum):
    DIV = "div"
    P = "p"

    @staticmethod
    def get_random() -> "HTMLNode":
        return random.choice([e for e in HTMLNode])


class HTMLNodeRelation(Enum):
    CHILD = "child"
    BEFORE = "before"
    AFTER = "after"

    @staticmethod
    def get_random() -> "HTMLNode":
        return random.choice([e for e in HTMLNode])


COLORS = [
    "red",
    "blue",
    "green",
    "orange",
    "black"
]


def create_random_node(node_type: HTMLNode) -> html_tag:
    random_color = random.choice(COLORS)

    random_style_attr = (
        f"height: {random.randint(0, 300)}px; "
        f"margin: {random.randint(0, 20)}px 0; "
        f"padding: {random.randint(0, 20)}px; "
        f"background-color: {random_color}"
    )
    if node_type == HTMLNode.DIV:
        return div("TEST DIV", style=random_style_attr)
    if node_type == HTMLNode.P:
        return p("TEST P", style=random_style_attr)
    raise NotImplementedError


def add_node_if_compatible(node, target_node):
    if isinstance(target_node, p):
        return
    target_node.add(node)


def create_html() -> str:
    doc = dominate.document(title='Sample HTML')

    with doc.head:
        # link(rel='stylesheet', href='style.css')
        script(type='text/javascript', src='html2pdf.js')

    nodes_so_far = [doc]

    with doc:
        for i_ in range(0, 100):
            random_node = create_random_node(HTMLNode.get_random())

            random_target_node = random.choice(nodes_so_far)

            add_node_if_compatible(random_node, random_target_node)

            nodes_so_far.append(random_node)

    return str(doc)


def main():
    parser = argparse.ArgumentParser(description='HTML2PDF random test generator')
    parser.add_argument('path_to_html2pdf')
    args = vars(parser.parse_args())
    print(args)

    path_to_html2pdf = args["path_to_html2pdf"]
    assert os.path.isfile(path_to_html2pdf)

    path_to_output_folder = os.path.join(PATH_TO_THIS_FOLDER, "output")
    shutil.rmtree(path_to_output_folder, ignore_errors=True)
    Path(path_to_output_folder).mkdir(exist_ok=True)

    for i_ in range(1, 2):
        html = create_html()
        path_to_test_dir = os.path.join(path_to_output_folder, f"test_{i_}")
        Path(path_to_test_dir).mkdir(exist_ok=True)

        shutil.copy(
            PATH_TO_TEST_CASE,
            path_to_test_dir
        )

        path_to_output_html2pdf = os.path.join(path_to_test_dir,
                                               "html2pdf.js")

        shutil.copy(
            path_to_html2pdf,
            path_to_output_html2pdf
        )

        path_to_output_html = os.path.join(path_to_test_dir, f"sample.html")
        with open(path_to_output_html, "w", encoding="utf8") as file_:
            file_.write(html)


main()
