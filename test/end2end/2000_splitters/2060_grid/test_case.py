import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case01_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case01.html")
)
case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

        #   The purpose of this group of tests (01*)
        #   is to check the simplest GRID splitting mechanism
        #   (splitting between lines, not within a line)
        #   under different line formation conditions.

        #   The height of the lines is expected to be stable.
        #   With the correct GRIG split, the lines will be distributed across the pages as follows:
        #     1) 0, 1-3
        #     2) 4-9
        #     3) 10-12

        #   And it is expected that when changing
        #   the align/justify parameters of cells in a “row,”
        #   the splitting result will be stable.
    def test_01(self):
        # 3 pages
        self.helper.do_open(case01_html_file_url)
        self.helper.assert_document_has_pages(3)
        # # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="L3-3"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="L4-1"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="L9-3"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="L10-1"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="L12-3"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 3)

    def test_1(self):
        # * Monotonic grid splits.
        # * a) The case without explicit `grid-columns` for cells.
        # * b) Overflow with `position: static` for grid container.
        # 2 pages
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(2)
        # # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="L9-1"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="L9-2"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="L10-2"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="L10-2"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 2)
