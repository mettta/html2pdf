import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)
test_element = '//*[@data-testid="testPoint"]'

class Test_T012_NoPageBreak(BaseCase):
    def test_01(self):
        helper= Helper(self)
        helper.do_open(index_html_file_url)
        helper.assert_document_has_pages(2, True)
        helper.assert_element_on_the_page(test_element, 2, True)
