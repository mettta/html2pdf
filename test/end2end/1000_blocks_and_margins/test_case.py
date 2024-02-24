import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case01_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-01-cf_fits.html")
)
case02_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-02-cf_exact.html")
)
case11_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-11-margin_1p.html")
)
case12_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-12-margin_2p.html")
)
case13_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-13-margin_1p.html")
)
case14_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-14-margin_2p.html")
)
case15_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case-15-margin_2p.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    # content flow as element
    def test_01(self):
        # content flow fits in 1st page
        self.helper.do_open(case01_html_file_url)
        self.helper.assert_document_has_pages(1)

    def test_02(self):
        # content flow exact equal to 1st page
        self.helper.do_open(case02_html_file_url)
        self.helper.assert_document_has_pages(1)

    # margins are taken into account
    def test_03(self):
        self.helper.do_open(case11_html_file_url)
        self.helper.assert_document_has_pages(1)

    def test_04(self):
        self.helper.do_open(case12_html_file_url)
        self.helper.assert_document_has_pages(2)

    def test_05(self):
        self.helper.do_open(case13_html_file_url)
        self.helper.assert_document_has_pages(1)

    def test_06(self):
        self.helper.do_open(case14_html_file_url)
        self.helper.assert_document_has_pages(2)

    # if the objects are exactly the same height as the reference
    def test_07(self):
        self.helper.do_open(case15_html_file_url)
        self.helper.assert_document_has_pages(2)
