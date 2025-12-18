import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_pre_last(self):
        # PRE last
        self.helper.open_case(path_to_this_test_file_folder, 'pre_last')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(3)

    def test_pre_middle(self):
        # PRE middle
        self.helper.open_case(path_to_this_test_file_folder, 'pre_middle')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(4)

    def test_table(self):
        # TABLE
        self.helper.open_case(path_to_this_test_file_folder, 'table')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_starts_page('//table', 2, 1)
        self.helper.assert_element_starts_page('//html2pdf4doc-print-forced-page-break', 3)
        self.helper.assert_element_on_the_page('//table', 3, 2)
        self.helper.assert_elements_order('//html2pdf4doc-page[@page="2"]', '//html2pdf4doc-page[@page="3"]')



