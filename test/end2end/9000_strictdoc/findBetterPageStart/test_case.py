import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

admonitionTitle = '//*[@data-testid="admonitionTitle"]'
primary = '//*[@data-testid="primary"]'
p_last = '//*[@data-testid="p_last"]'


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        # 2 or 3 pages were produced on Firefox or Chrome.
        # To assert on the page number we simplified the markup.
        self.helper.assert_document_has_pages(2)

        # 1. Check that the specific admonition title has the no-hanging flag
        self.helper.assert_element_has_attribute(admonitionTitle, 'html2pdf4doc-flag-no-hanging')
        self.helper.assert_element_on_the_page(admonitionTitle, 2)

        # 2. Check that the right parent node that contains 'admonition title' starts page "2"
        self.helper.assert_element_starts_page(primary, 2)

