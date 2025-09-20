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

w1 = '//*[@data-testid="top-node-wrapper"]'
w2 = '//*[@data-testid="last-page-node-wrapper"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(1, True)

    def test_02(self):
        self.helper.do_open(case2_html_file_url)
        self.helper.assert_document_has_pages(2, True)

    def test_03(self):
        self.helper.do_open(case3_html_file_url)
        self.helper.assert_document_has_pages(2, True)

    def test_04(self):
        self.helper.do_open(case4_html_file_url)
        self.helper.assert_document_has_pages(2, True)

    def test_05(self):
        self.helper.do_open(case5_html_file_url)
        self.helper.assert_document_has_pages(2, True)

    def test_06(self):
        # long inline image in inline .document
        self.helper.do_open(case6_html_file_url)
        self.helper.assert_document_has_pages(3, True)
        self.helper.assert_element_on_the_page(w1, 2)
        self.helper.assert_element_on_the_page(w2, 3)
