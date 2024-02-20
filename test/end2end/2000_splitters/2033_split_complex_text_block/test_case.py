import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case0_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case0.html")
)
part_0 = '//html2pdf-complex-text-block//*[@data-child="0"]'


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.do_open(case0_html_file_url)
        self.helper.assert_html2pdf_success()
        self.helper.assert_element_on_the_page(part_0, 1, True)
