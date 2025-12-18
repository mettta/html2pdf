import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)
case2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case2.html")
)


# pre1 = '//*[@data-testid="p10"]'
pre1 = "//*[contains(@class, 'html2pdf4doc-bottom-cut')]"
pre = "//pre"
admonition = "//*[contains(@class, 'admonition')]"


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        helper = Helper(self)
        helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(admonition, 3)
        self.helper.assert_element_starts_page(admonition, 3)

    def test_002(self):
        helper = Helper(self)
        helper.do_open(case2_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(admonition, 2)
        self.helper.assert_element_starts_page(admonition, 2)
