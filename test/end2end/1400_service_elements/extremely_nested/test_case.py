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

test_element1 = '//*[@data-testid="testPointParent1"]'
point_inside_p2 = '//*[@data-testid="point-inside-p2"]'
parent2 = '//*[@data-testid="parent-2"]'
parent3 = '//*[@data-testid="parent-3"]'
p1 = '//*[@data-testid="p1"]'
p2 = '//*[@data-testid="p2"]'
p9last = '//*[@data-testid="p9_last"]'
p10 = '//*[@data-testid="p10"]'
neutral = '//html2pdf-neutral' # [@html2pdf-page-start="5"]


# findBetterPageStart
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        helper = Helper(self)
        helper.do_open(index1_html_file_url)

        self.helper.assert_document_has_pages(5, True)
        self.helper.assert_element_starts_page(test_element1, 2)
        self.helper.assert_element_on_the_page(test_element1, 2, True)
        self.helper.assert_element_on_the_page(point_inside_p2, 3, True)

    def test_002(self):
        helper = Helper(self)
        helper.do_open(index2_html_file_url)

        self.helper.assert_document_has_pages(7, True)
        self.helper.assert_element_starts_page(test_element1, 2)
        self.helper.assert_element_on_the_page(test_element1, 2, True)
        self.helper.assert_element_on_the_page(parent2, 2, True)
        self.helper.assert_element_on_the_page(parent3, 3, True)
        self.helper.assert_element_starts_page(neutral, 5)
        self.helper.assert_element_on_the_page(p9last, 5, True)
        self.helper.assert_element_starts_page(p10, 6)
        self.helper.assert_element_on_the_page(p10, 6, True)

    def test_003(self):
        helper = Helper(self)
        helper.do_open(index3_html_file_url)

        self.helper.assert_document_has_pages(6, True)
        self.helper.assert_element_on_the_page(parent2, 1, True)
        self.helper.assert_element_on_the_page(parent3, 2, True)
        self.helper.assert_element_starts_page(parent3, 2)
        self.helper.assert_element_on_the_page(p1, 2, True)
        self.helper.assert_element_on_the_page(p2, 2, True)
        self.helper.assert_element_on_the_page(p9last, 4, True)
        self.helper.assert_element_starts_page(p10, 5)
        self.helper.assert_element_on_the_page(p10, 5, True)
        self.helper.assert_element_starts_page(neutral, 4)

    def test_004(self):
        helper = Helper(self)
        helper.do_open(index4_html_file_url)

        self.helper.assert_document_has_pages(9, True)
        self.helper.assert_element_on_the_page(parent2, 1, True)
        self.helper.assert_element_on_the_page(parent3, 2, True)
        self.helper.assert_element_starts_page(parent3, 2)
        self.helper.assert_element_on_the_page(p1, 3, True)
        self.helper.assert_element_starts_page(p1, 3)
        self.helper.assert_element_on_the_page(p2, 3, True)
        # 1-st break by neutral service element (in tail at the end):
        self.helper.assert_element_starts_page('//html2pdf-neutral', 5, 1)
        # 2-st break by neutral service element (in tail at the end):
        self.helper.assert_element_starts_page('//html2pdf-neutral', 6, 2)
        self.helper.assert_element_on_the_page(p9last, 6, True)
        self.helper.assert_element_on_the_page(p10, 6, True)
