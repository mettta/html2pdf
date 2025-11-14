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
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(3)

    def test_pre_last(self):
        # PRE middle
        self.helper.open_case(path_to_this_test_file_folder, 'pre_middle')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(4)

    def test_pre_last(self):
        # TABLE
        self.helper.open_case(path_to_this_test_file_folder, 'table')
        self.helper.assert_html2pdf_success()
        self.helper.assert_document_has_pages(2)



