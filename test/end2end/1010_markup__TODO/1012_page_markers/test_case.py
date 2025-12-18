import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

# reference
# ==== case files ==============================================================
# use:
#     self.helper.open_case(path_to_this_test_file_folder, 1)
# to get:
#     case_1.html
# ==== elements ================================================================
# element_tag = "//element-tag"
# element_attr = '//*[@data-testid="element-attr"]'
# element_class = "//*[contains(@class, 'element-class')]"
# ==== useful helpers ==========================================================
# self.helper.assert_document_has_pages(1)
# self.helper.assert_element_starts_page(el, 1)
# self.helper.assert_element_on_the_page(el, 1)

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

pusher = '//*[@data-testid="pusher"]'
closer = '//*[@data-testid="closer"]'
element1 = '//*[@data-testid="element1"]'
element2 = '//*[@data-testid="element2"]'
element3 = '//*[@data-testid="element3"]'
frontpage = '//html2pdf-frontpage'
content_flow_start = '//html2pdf-content-flow-start'
content_flow_end = '//html2pdf-content-flow-end'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        # has frontpage
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(4)
        # 1 ----------------------------------
        self.helper.assert_element_starts_page(frontpage, 1)
        self.helper.assert_element_ends_page(frontpage, 1)
        # 2 ----------------------------------
        self.helper.assert_element_starts_page(content_flow_start, 2)
        self.helper.assert_element_ends_page(element1, 2)
        # 3 ----------------------------------
        self.helper.assert_element_starts_page(element2, 3)
        self.helper.assert_element_ends_page(element2, 3)
        # 4 ----------------------------------
        self.helper.assert_element_starts_page(element3, 4)
        self.helper.assert_element_ends_page(content_flow_end, 4)

    def test_002(self):
        # has no frontpage
        self.helper.open_case(path_to_this_test_file_folder, '002')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(3)
        # 1 ----------------------------------
        self.helper.assert_element_starts_page(content_flow_start, 1)
        self.helper.assert_element_ends_page(element1, 1)
        # 2 ----------------------------------
        self.helper.assert_element_starts_page(element2, 2)
        self.helper.assert_element_ends_page(element2, 2)
        # 3 ----------------------------------
        self.helper.assert_element_starts_page(element3, 3)
        self.helper.assert_element_ends_page(content_flow_end, 3)
