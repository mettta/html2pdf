import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)

test_element11 = '//*[@data-testid="testPoint11"]'
test_element12 = '//*[@data-testid="testPoint12"]'
test_element21 = '//*[@data-testid="testPoint21"]'
test_element22 = '//*[@data-testid="testPoint22"]'
test_element30 = '//*[@data-testid="testPoint30"]'
test_element41 = '//*[@data-testid="testPoint41"]'
test_element42 = '//*[@data-testid="testPoint42"]'
test_element50 = '//*[@data-testid="testPoint50"]'
test_element60 = '//*[@data-testid="testPoint60"]'
test_element71 = '//*[@data-testid="testPoint71"]'
test_element72 = '//*[@data-testid="testPoint72"]'


# 071_pagebreak
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        helper = Helper(self)
        helper.do_open(index_html_file_url)

        self.helper.assert_document_has_pages(7, True)
        # first "before" is the first in content flow
        # so it shouldn't trigger and create a blank page
        self.helper.assert_element_on_the_page(test_element11, 1, True)

        # counter "after" and "before" create only 1 page break
        self.helper.assert_element_on_the_page(test_element12, 1, True)
        self.helper.assert_element_on_the_page(test_element21, 2, True)
        self.helper.assert_element_on_the_page(test_element22, 2, True)
        self.helper.assert_element_on_the_page(test_element30, 3, True)
        self.helper.assert_element_on_the_page(test_element41, 4, True)
        self.helper.assert_element_on_the_page(test_element42, 4, True)
        self.helper.assert_element_on_the_page(test_element50, 5, True)

        # "forced" always creates a new page
        self.helper.assert_element_on_the_page(test_element60, 6, True)
        self.helper.assert_element_on_the_page(test_element71, 7, True)

        # last "after" is the last in content flow,
        # so it shouldn't trigger and create a blank page
        self.helper.assert_element_on_the_page(test_element72, 7, True)
