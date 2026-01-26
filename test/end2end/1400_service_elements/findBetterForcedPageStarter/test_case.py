import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

h1 = '//*[@data-testid="h1"]'
h2 = '//*[@data-testid="h2"]'
h3 = '//*[@data-testid="h3"]'

# T011_forced_page_break
class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.open_case(path_to_this_test_file_folder, '001')
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(h1, 1)
        self.helper.assert_element_on_the_page(h2, 2)

    def test_002(self):
        self.helper.open_case(path_to_this_test_file_folder, '002')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(h1, 2)
        self.helper.assert_element_on_the_page(h2, 3)

    def test_003(self):
        self.helper.open_case(path_to_this_test_file_folder, '003')
        self.helper.assert_document_has_pages(4)
        self.helper.assert_element_on_the_page(h1, 2)
        self.helper.assert_element_on_the_page(h2, 3)
        self.helper.assert_element_on_the_page(h3, 4)

    def test_004(self):
        self.helper.open_case(path_to_this_test_file_folder, '004')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(h1, 2)
        self.helper.assert_element_on_the_page(h2, 3)

    def test_005(self):
        self.helper.open_case(path_to_this_test_file_folder, '005')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(h1, 2)
        self.helper.assert_element_on_the_page(h2, 3)

    def test_010(self):
        # Templates at the beginning of the BODY should not be counted,
        # and H1 should be considered the first
        # (and should not receive an additional break before it).
        self.helper.open_case(path_to_this_test_file_folder, '010_templates_first')
        self.helper.assert_document_has_pages(3)
        self.helper.assert_element_on_the_page(h1, 2)

    def test_011(self):
        # display:none at the beginning of the BODY should not be counted.
        self.helper.open_case(path_to_this_test_file_folder, '011_display_none')
        self.helper.assert_document_has_pages(2)
        self.helper.assert_element_on_the_page(h1, 1)
