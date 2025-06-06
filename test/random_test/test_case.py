import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "sample.html")
)


class Test(BaseCase):
    def test_001(self):
        helper = Helper(self)
        helper.do_open_and_assert_title(index_html_file_url, "Sample HTML")
        self.sleep(1)
