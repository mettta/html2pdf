import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

h1 = '//*[@data-testid="h1"]'
img_wrapper = '//*[@data-testid="img-wrapper"]'
img = '//*[@data-testid="img"]'
text2 = '//*[@data-testid="text2"]'

# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_starts_page(h1, 2)
        self.helper.assert_element_on_the_page(img_wrapper, 2)
        self.helper.assert_element_starts_page(text2, 3)

