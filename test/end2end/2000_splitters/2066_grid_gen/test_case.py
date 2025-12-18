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
        self.helper.assert_html2pdf4doc_success()
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
        self.helper.assert_html2pdf4doc_success()
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
        helper.assert_html2pdf4doc_success()
        helper.assert_document_has_pages(3)
        chunk_1 = '//*[@data-testid="root-element"][1]'
        chunk_2 = '//*[@data-testid="root-element"][2]'
        chunk_3 = '//*[@data-testid="root-element"][3]'
        # children_*: Check that there are right children on the edge of chunk.
        # wrong_children_*: Verify that no cells from rows
        #                   of the neighboring chunk (across the split line)
        #                   leaked into the current chunk.
        children_1 = [
            # top row 0
            '//*[@data-testid="L0"]',
            # bottom row 3
            '//*[@data-testid="L3-0"]',
            '//*[@data-testid="L3-1"]',
            '//*[@data-testid="L3-2"]',
            '//*[@data-testid="L3-3"]',
        ]
        wrong_children_1 = [
            # under the bottom row 3
            '//*[@data-testid="L4-0"]',
            '//*[@data-testid="L4-1"]',
            '//*[@data-testid="L4-2"]',
            '//*[@data-testid="L4-3"]'
        ]
        children_2 = [
            # top row 4
            '//*[@data-testid="L4-0"]',
            '//*[@data-testid="L4-1"]',
            '//*[@data-testid="L4-2"]',
            '//*[@data-testid="L4-3"]',
            # bottom row 13
            '//*[@data-testid="L13-0"]',
            '//*[@data-testid="L13-1"]',
            '//*[@data-testid="L13-2"]',
            '//*[@data-testid="L13-3"]',
        ]
        wrong_children_2 = [
            # above the top row 4
            '//*[@data-testid="L3-0"]',
            '//*[@data-testid="L3-1"]',
            '//*[@data-testid="L3-2"]',
            '//*[@data-testid="L3-3"]',
            # under the bottom row 13
            '//*[@data-testid="L14-0"]',
            '//*[@data-testid="L14-1"]',
            '//*[@data-testid="L14-2"]',
            '//*[@data-testid="L14-3"]',
        ]
        children_3 = [
            # top row 14
            '//*[@data-testid="L14-0"]',
            '//*[@data-testid="L14-1"]',
            '//*[@data-testid="L14-2"]',
            '//*[@data-testid="L14-3"]',
            # bottom row 20 (the last)
            '//*[@data-testid="L20-0"]',
            '//*[@data-testid="L20-1"]',
            '//*[@data-testid="L20-2"]',
            '//*[@data-testid="L20-3"]',
        ]
        wrong_children_3 = [
            # above the top row 14
            '//*[@data-testid="L13-0"]',
            '//*[@data-testid="L13-1"]',
            '//*[@data-testid="L13-2"]',
            '//*[@data-testid="L13-3"]',
        ]
        # 1 ----------------------------------
        helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        helper.assert_element_on_the_page(chunk_1, 1)
        helper.assert_direct_children_present(chunk_1, children_1)
        helper.assert_direct_children_absent(chunk_1, wrong_children_1)
        # 2 ----------------------------------
        helper.assert_element_on_the_page(chunk_2, 2)
        helper.assert_direct_children_present(chunk_2, children_2)
        helper.assert_direct_children_absent(chunk_2, wrong_children_2)
        # 3 ----------------------------------
        helper.assert_element_on_the_page(chunk_3, 3)
        helper.assert_direct_children_present(chunk_3, children_3)
        helper.assert_direct_children_absent(chunk_3, wrong_children_3)
        helper.assert_element_on_the_page('//*[@data-testid="closer"]', 3)

    def test_003_0(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_0')
        self.check_series_003(self.helper)

    def test_003_1(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_1')
        self.check_series_003(self.helper)

    def test_003_2(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_2')
        self.check_series_003(self.helper)

    def test_003_3(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_3')
        self.check_series_003(self.helper)

    def test_003_4(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_4')
        self.check_series_003(self.helper)

    def test_003_5(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_5')
        self.check_series_003(self.helper)

    def test_003_6(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_6')
        self.check_series_003(self.helper)

    def test_003_7(self):
        # TC-GRID-003 series
        self.helper.open_case(path_to_this_test_file_folder, '003_7')
        self.check_series_003(self.helper)

    def test_003_10(self):
        # TC-GRID-003 series
        # first empty slice cells / null-branch in getSplitPointsPerCells
        chunk_1 = '//*[@data-testid="root-element"][1]'
        chunk_2 = '//*[@data-testid="root-element"][2]'
        children_1 = [
            # top row 0
            '//*[@data-testid="L0"]',
            # bottom row 1
            '//*[@data-testid="L1-0"]',
            '//*[@data-testid="L1-1"]',
            '//*[@data-testid="L1-2"]',
            '//*[@data-testid="L1-3"]',
        ]
        wrong_children_1 = [
            # under the bottom row 1
            '//*[@data-testid="L2-0"]',
            '//*[@data-testid="L2-1"]',
            '//*[@data-testid="L2-2"]',
            '//*[@data-testid="L2-3"]'
        ]
        children_2 = [
            # top row 2
            '//*[@data-testid="L2-0"]',
            '//*[@data-testid="L2-1"]',
            '//*[@data-testid="L2-2"]',
            '//*[@data-testid="L2-3"]',
            # bottom row 6 (last)
            '//*[@data-testid="L6-0"]',
            '//*[@data-testid="L6-1"]',
            '//*[@data-testid="L6-2"]',
            '//*[@data-testid="L6-3"]',
        ]
        wrong_children_2 = [
            # above the top row 2
            '//*[@data-testid="L1-0"]',
            '//*[@data-testid="L1-1"]',
            '//*[@data-testid="L1-2"]',
            '//*[@data-testid="L1-3"]',
        ]
        self.helper.open_case(path_to_this_test_file_folder, '003_10')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(2)
        # 1 ----------------------------------
        self.helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        self.helper.assert_element_on_the_page(chunk_1, 1)
        self.helper.assert_direct_children_present(chunk_1, children_1)
        self.helper.assert_direct_children_absent(chunk_1, wrong_children_1)
        # 2 ----------------------------------
        self.helper.assert_element_on_the_page(chunk_2, 2)
        self.helper.assert_direct_children_present(chunk_2, children_2)
        self.helper.assert_direct_children_absent(chunk_2, wrong_children_2)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 2)
