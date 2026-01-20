import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

p = '//*[@data-testid="p"]'
div = '//*[@data-testid="div"]'

# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001_contain_and_fit(self):
        self.helper.open_case(path_to_this_test_file_folder, 'contain_and_fit')
        self.helper.assert_document_has_pages(5)
        self.helper.assert_element_on_the_page(p, 2)
        self.helper.assert_element_on_the_page(div, 3)

