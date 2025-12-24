import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case02_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "20251011_182559.html")
)

problematic = '//*[@data-testid="problematic"]'
admonition_warning_title = '//*[@data-testid="admonition-warning-title"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_02(self):
        # 2 pages
        # inside border
        self.helper.do_open(case02_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(admonition_warning_title, 1)
