import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

pusher = '//*[@data-testid="pusher"]'
closer = '//*[@data-testid="closer"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        # text node only
        # There should be no overflow, balancers, the last line is moved to the third page.
        # 3 pages
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(3)
        # 1 ----------------------------------
        # self.helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        # self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 3)

    def test_002(self):
        # pygments
        # There should be no overflow, balancers, the last line is moved to the third page.
        # 2 pages
        self.helper.open_case(path_to_this_test_file_folder, '002')
        self.helper.assert_html2pdf4doc_success()
        self.helper.assert_document_has_pages(2)
