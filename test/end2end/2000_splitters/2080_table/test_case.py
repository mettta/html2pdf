import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)
case2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case2.html")
)
case12_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case12.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_1(self):
        # *1
        # 4 pages / table parts
        self.helper.do_open(case12_html_file_url)
        self.helper.assert_document_has_pages(4)
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="red-first"]', 1
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="red-last"]', 2
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="green-first-left"]', 2
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="green-first"]', 2
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="green-part-left"]', 3
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="green-part"]', 3
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="green-last"]', 3
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="blue-first"]', 3
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="blue-last-left"]', 4
        )
        self.helper.assert_element_on_the_page(
            '//*[@data-testid="blue-last"]', 4
        )

    def test_2(self):
        # *1
        # 4 pages / table parts
        self.helper.do_open(case12_html_file_url)
        self.helper.assert_document_has_pages(3)
        # TODO

    def test_12(self):
        # *1
        # 4 pages / table parts
        self.helper.do_open(case12_html_file_url)
        self.helper.assert_document_has_pages(4)
