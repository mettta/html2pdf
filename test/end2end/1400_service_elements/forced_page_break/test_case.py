import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)
test_element2 = '//*[@data-testid="testPoint2"]'
test_element3 = '//*[@data-testid="testPoint3"]'
test_element4 = '//*[@data-testid="testPoint4"]'
test_element5 = '//*[@data-testid="testPoint5"]'


# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(index_html_file_url)

        self.helper.assert_document_has_pages(5)
        self.helper.assert_element_on_the_page(test_element2, 2)
        self.helper.assert_element_on_the_page(test_element3, 3)
        self.helper.assert_element_on_the_page(test_element4, 4)
        self.helper.assert_element_on_the_page(test_element5, 5)
