import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case01_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-01.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_01(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        # data-preloader-target='' solved by _resolveTarget(customConfig)
        self.helper.assert_document_has_pages(1)

        # TODO check config option names and warnings from fallback:
        # [HTML2PDF4DOC] Config option "printWidth" is deprecated. Use "paperWidth" instead.
        # [HTML2PDF4DOC] Config option "printHeight" is deprecated. Use "paperHeight" instead.

    def test_02(self):
        self.helper.open_case(path_to_this_test_file_folder, 'legacy_selector_prefix')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_has_attribute('//*[@data-testid="ignored"]', 'html2pdf4doc-print-hide');
        self.helper.assert_element_has_text('//span[@html2pdf-page-number-total]', '3');
