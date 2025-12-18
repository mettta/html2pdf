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
div1 = '//*[@data-testid="div1"]'
div2 = '//*[@data-testid="div2"]'
root_element = '//*[@data-testid="root-element"]'
content_flow_start = '//html2pdf4doc-content-flow-start'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(2)
        # 1 ----------------------------------
        self.helper.assert_element_starts_page(content_flow_start, 1)
        self.helper.assert_element_on_the_page(pusher, 1)
        self.helper.assert_element_ends_page(div1, 1)
        # 2 ----------------------------------
        self.helper.assert_element_starts_page(div2, 2)
        self.helper.assert_element_on_the_page(closer, 2)
