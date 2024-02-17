import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)
test_text = "I want to be on page 2."
test_element = '//*[@data-testid="testPoint"]'


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open_and_assert(index_html_file_url, test_text)
        self.helper.assert_document_has_pages(2, True)
        self.helper.assert_element_on_the_page(test_element, 2, True)
        # f'//*[contains(., "{test_text}")]', 2, True
