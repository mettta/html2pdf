import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)
case2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case2.html")
)
case3_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case3.html")
)
case4_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case4.html")
)
case5_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case5.html")
)
case6_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case6.html")
)

admonitionTitle = '//*[@data-testid="admonitionTitle"]'
page2starter = '//*[@data-testid="page2starter"]'


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(case1_html_file_url)
        # 2 or 3 pages were produced on Firefox or Chrome.
        # To assert on the page number we simplified the markup.
        self.helper.assert_document_has_pages(2, report=True)

        # 1. Check that the specific admonition title has the no-hanging flag
        self.helper.assert_element_on_the_page(admonitionTitle, 2, report=True)
        self.helper.assert_element_has_attribute(admonitionTitle, 'html2pdf-flag-no-hanging')

        # 2. Check that the right parent node that contains 'admonition title' starts page "2"
        self.helper.assert_element_starts_page(page2starter, 2)

