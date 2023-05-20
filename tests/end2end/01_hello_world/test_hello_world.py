import os

from seleniumbase import BaseCase

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))


class Test_HelloWorld(BaseCase):
    def test_01(self):
        index_html_file_url = (
            "file:///" +
            os.path.join(path_to_this_test_file_folder, "index.html")
        )
        self.open(index_html_file_url)
        self.assert_text("Hello world!")
        self.assert_no_404_errors()
        self.assert_no_js_errors()
