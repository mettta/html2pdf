import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)
resize_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "resize.html")
)
inline_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "inline.html")
)
inline_res_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "inline-res.html")
)

test_image_vertical = '//*[@data-testid="testImageVertical"]'
test_image_horizontal = '//*[@data-testid="testImageHorizontal"]'
test_element1 = '//*[@data-testid="testPoint1"]'
test_element2 = '//*[@data-testid="testPoint2"]'

class Test_T022_Image(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.do_open(index_html_file_url)
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(test_element1, 1, True)
        self.helper.assert_element_on_the_page(test_element2, 2, True)

    def test_02_inline(self):
        self.helper.do_open(inline_html_file_url)
        self.helper.assert_document_has_pages(1)
        # todo: inline elements

    def test_03_resize(self):
        self.helper.do_open(resize_html_file_url)
        self.helper.assert_element_fit_height(test_image_vertical)
        # todo: Implement a case 'fit_width' and write a test
        # self.helper.assert_element_fit_width(test_image_horizontal)
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(test_element1, 1, True)
        self.helper.assert_element_on_the_page(test_element2, 3, True)

    # def test_04_inline_resize(self):
    #     self.helper.do_open(inline_res_html_file_url)
    #     self.helper.assert_document_has_pages(1)
    #     # self.sleep(1000)
        # todo: inline elements & image resize
