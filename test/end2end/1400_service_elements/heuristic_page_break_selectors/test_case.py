import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

not_only_child = '//*[@data-testid="not-only-child"]'
only_child = '//*[@data-testid="only-child"]'
not_first_child = '//*[@data-testid="not-first-child"]'
first_child = '//*[@data-testid="first-child"]'
not_last_child = '//*[@data-testid="not-last-child"]'
last_child = '//*[@data-testid="last-child"]'

# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_document_has_pages(4)
        # --- 1 ---
        self.helper.assert_element_on_the_page(not_only_child, 1)
        # --- 2 ---
        # html2pdf4doc-print-forced-page-break starts the page
        self.helper.assert_element_on_the_page(only_child, 2)
        self.helper.assert_element_on_the_page(not_first_child, 2)
        # --- 3 ---
        # html2pdf4doc-print-forced-page-break starts the page
        self.helper.assert_element_on_the_page(first_child, 3)
        self.helper.assert_element_on_the_page(not_last_child, 3)
        # --- 4 ---
        # html2pdf4doc-print-forced-page-break starts the page
        self.helper.assert_element_on_the_page(last_child, 4)
