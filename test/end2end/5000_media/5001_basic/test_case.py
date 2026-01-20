import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

im1 = '//*[@data-testid="im1"]'
wr2 = '//*[@data-testid="wr2"]'
wr3 = '//*[@data-testid="wr3"]'
last_p = '//*[@data-testid="last-p"]'

# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001_inline_wrapper_starts(self):
        self.helper.open_case(path_to_this_test_file_folder, 'inline_wrapper_starts')
        self.helper.assert_document_has_pages(4)
        self.helper.assert_element_on_the_page(im1, 1)
        self.helper.assert_element_on_the_page(wr2, 2)
        self.helper.assert_element_starts_page(wr3, 3)
        self.helper.assert_element_starts_page(last_p, 4)

