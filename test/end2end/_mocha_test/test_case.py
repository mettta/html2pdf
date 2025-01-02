import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "..", "..", "unit", "examples") + "/test.html"
)


class Test(BaseCase):
    def test(self):
        helper = Helper(self)
        helper.do_open_and_assert_title(index_html_file_url, "Mocha Tests")
        self.assert_text("failures: 0")
        self.assert_no_js_errors()
