import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.do_open(index_html_file_url)

        self.helper.assert_document_has_pages(2, True)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR1"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR2"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR3"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR4"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR5"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR6"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR7"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR8"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR9"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="TR10"]', 2)
