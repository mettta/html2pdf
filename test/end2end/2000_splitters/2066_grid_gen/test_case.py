import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

# reference
# ==== case files ==============================================================
# use:
#     self.helper.open_case(path_to_this_test_file_folder, 1)
# to get:
#     case001.html
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
root_element = '//*[@data-testid="root-element"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        # TC-GRID-001 — Fits On One Page
        # 1 pages
        # self.helper.do_open(html_file_url_001)
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(1)
        # 1 ----------------------------------
        self.helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="L0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="L3-3"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 1)

    def test_002(self):
        # TC-GRID-002 — Page Break On Row Boundary / Clean Cut
        # 3 pages
        self.helper.open_case(path_to_this_test_file_folder, '002')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(3)
        # 1 ----------------------------------
        self.helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="L0"]', 1)
        # Clean Cut:
        self.helper.assert_element_on_the_page('//*[@data-testid="L3-3"]', 1)
        # 2 ----------------------------------
        self.helper.assert_element_on_the_page('//*[@data-testid="L4-0"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="L13-3"]', 2)
        # 3 ----------------------------------
        self.helper.assert_element_on_the_page('//*[@data-testid="L14-0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="L20-3"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 3)

    @staticmethod
    def check_series_003(helper):
        # TC-GRID-003 — Alignment Variants
        helper.assert_html2pdf_success()
        helper.assert_document_has_pages(3)
        # 1 ----------------------------------
        helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        helper.assert_element_on_the_page('//*[@data-testid="L0"]', 1)
        helper.assert_element_on_the_page('//*[@data-testid="L3-0"]', 1)
        helper.assert_element_on_the_page('//*[@data-testid="L3-1"]', 1)
        helper.assert_element_on_the_page('//*[@data-testid="L3-2"]', 1)
        helper.assert_element_on_the_page('//*[@data-testid="L3-3"]', 1)
        # 2 ----------------------------------
        helper.assert_element_on_the_page('//*[@data-testid="L4-0"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L4-1"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L4-2"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L4-3"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L13-0"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L13-1"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L13-2"]', 2)
        helper.assert_element_on_the_page('//*[@data-testid="L13-3"]', 2)
        # 3 ----------------------------------
        helper.assert_element_on_the_page('//*[@data-testid="L14-0"]', 3)
        helper.assert_element_on_the_page('//*[@data-testid="L14-1"]', 3)
        helper.assert_element_on_the_page('//*[@data-testid="L14-2"]', 3)
        helper.assert_element_on_the_page('//*[@data-testid="L14-3"]', 3)
        helper.assert_element_on_the_page('//*[@data-testid="L20-3"]', 3)
        helper.assert_element_on_the_page('//*[@data-testid="closer"]', 3)

    def test_003_0(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_0')
        self.check_series_003(self.helper)

    def test_003_1(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_1')
        self.check_series_003(self.helper)
