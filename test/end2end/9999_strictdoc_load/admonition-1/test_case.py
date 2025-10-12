import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case01_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "20251011_164949.html")
)

problematic = '//*[@data-testid="problematic"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        # 3 pages
        self.helper.do_open(case01_html_file_url)
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(problematic, 3)
        self.helper.assert_element_starts_page(problematic, 3)
