import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)

test_image_vertical = '//*[@data-testid="testImageVertical"]'
test_image_horizontal = '//*[@data-testid="testImageHorizontal"]'
test_element1 = '//*[@data-testid="testPoint1"]'
test_element2 = '//*[@data-testid="testPoint2"]'

class Test_T022_ImageResize(BaseCase):
    def test_01(self):
        helper= Helper(self)
        helper.do_open(index_html_file_url)

        helper.assert_element_fit_height(test_image_vertical)
        # todo: Implement a case 'fit_width' and write a test
        # helper.assert_element_fit_width(test_image_horizontal)
        helper.assert_document_has_pages(3)
        helper.assert_element_on_the_page(test_element1, 1, True)
        helper.assert_element_on_the_page(test_element2, 3, True)
