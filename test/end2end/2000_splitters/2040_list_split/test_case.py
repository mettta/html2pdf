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

point_element = '//b[@class="point_element"]'
line1 = '//b[@class="li1"]'
line2 = '//b[@class="li2"]'
line3 = '//b[@class="li3"]'


# _T033_ListSplit
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(line1, 2)
        self.helper.assert_element_on_the_page(line2, 2)
        self.helper.assert_element_on_the_page(line3, 2)

    def test_02(self):
        self.helper.do_open(case2_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(line1, 1)
        self.helper.assert_element_on_the_page(line2, 2)
        self.helper.assert_element_on_the_page(line3, 2)

    def test_03(self):
        self.helper.do_open(case3_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(line1, 1)
        self.helper.assert_element_on_the_page(line2, 1)
        self.helper.assert_element_on_the_page(line3, 2)

    def test_04(self):
        self.helper.do_open(case4_html_file_url)
        self.helper.assert_document_has_pages(1)
        self.helper.assert_element_on_the_page(line1, 1)
        self.helper.assert_element_on_the_page(line2, 1)
        self.helper.assert_element_on_the_page(line3, 1)

    def test_05(self):
        self.helper.do_open(case5_html_file_url)
        self.helper.assert_document_has_pages(2)

    def test_06(self):
        self.helper.do_open(case6_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(point_element, 2)
