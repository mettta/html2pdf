import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
index1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index1.html")
)
index2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index2.html")
)
index3_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index3.html")
)
index4_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index4.html")
)

title1 = '//*[@data-testid="title1"]'
title2 = '//*[@data-testid="title2"]'
title3 = '//*[@data-testid="title3"]'
title4 = '//*[@data-testid="title4"]'
title5 = '//*[@data-testid="title5"]'
title6 = '//*[@data-testid="title6"]'
title7 = '//*[@data-testid="title7"]'
title8 = '//*[@data-testid="title8"]'
p1 = '//*[@data-testid="p1"]'


# findBetterPageStart
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        helper = Helper(self)
        helper.do_open(index1_html_file_url)

        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_starts_page(title1, 2)
        self.helper.assert_element_on_the_page(title1, 2)
        self.helper.assert_element_on_the_page(p1, 2)

    def test_02(self):
        helper = Helper(self)
        helper.do_open(index2_html_file_url)

        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_starts_page(title1, 2)
        self.helper.assert_element_on_the_page(title1, 2)
        self.helper.assert_element_on_the_page(title2, 2)
        self.helper.assert_element_on_the_page(p1, 2)

    def test_03(self):
        helper = Helper(self)
        helper.do_open(index3_html_file_url)

        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_starts_page(title1, 2)
        self.helper.assert_element_on_the_page(title1, 2)
        self.helper.assert_element_on_the_page(title2, 2)
        self.helper.assert_element_on_the_page(title3, 2)
        self.helper.assert_element_on_the_page(title4, 2)
        self.helper.assert_element_on_the_page(title5, 2)
        self.helper.assert_element_on_the_page(title6, 2)
        self.helper.assert_element_starts_page(title7, 3)
        self.helper.assert_element_on_the_page(title7, 3)
        self.helper.assert_element_on_the_page(title8, 3)
        self.helper.assert_element_on_the_page(p1, 3)

    def test_04(self):
        helper = Helper(self)
        helper.do_open(index4_html_file_url)

        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(title1, 1)
        self.helper.assert_element_on_the_page(title2, 1)
        self.helper.assert_element_on_the_page(title3, 1)
        self.helper.assert_element_on_the_page(title4, 1)
        self.helper.assert_element_on_the_page(title5, 1)
        self.helper.assert_element_on_the_page(title6, 1)
        self.helper.assert_element_starts_page(title7, 2)
        self.helper.assert_element_on_the_page(title7, 2)
        self.helper.assert_element_on_the_page(title8, 2)
        self.helper.assert_element_on_the_page(p1, 2)
