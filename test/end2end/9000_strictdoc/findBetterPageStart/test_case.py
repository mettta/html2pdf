import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)
case2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case2.html")
)
case3_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case3.html")
)
case4_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case4.html")
)
case5_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case5.html")
)
case6_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case6.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(3)

        # 1. Check that the specific admonition title has the no-hanging flag
        target = self.find_element(
            'sdoc-node-content:nth-child(5) p.first.admonition-title'
        )
        assert target.get_attribute("html2pdf-flag-no-hanging") is not None, \
            "Expected element to have [html2pdf-flag-no-hanging]"

        # 2. Check that the scope node has page-start="2"
        page_start = self.find_element(
            'sdoc-node-content:nth-child(5) sdoc-scope.node_fields_group-primary'
        )
        assert page_start.get_attribute("html2pdf-page-start") == "2", \
            "Expected element to have [html2pdf-page-start='2']"

        # 3. Check that this page-start element appears after the page marker with [page='2']
        page_marker = self.find_element('html2pdf-page[page="2"]')
        assert page_marker.location['y'] < page_start.location['y'], \
            "Expected page-start element to appear after page marker with [page='2']"

