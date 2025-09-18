import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
case1_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case1.html")
)
case2_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case2.html")
)
case3_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case3.html")
)
case4_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case4.html")
)
case5_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case5.html")
)
case6_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case6.html")
)



class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_1(self):
        # * Monotonic grid splits.
        # * a) The case without explicit `grid-columns` for cells.
        # * b) Overflow with `position: static` for grid container.
        # 2 pages
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(2)
        # # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="L9-1"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="L9-2"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="L10-2"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="L10-2"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 2)
