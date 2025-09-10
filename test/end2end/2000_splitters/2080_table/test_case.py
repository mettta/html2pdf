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
case10_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case10.html")
)
case11_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case10.html")
)
case12_html_file_url = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "case10.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_1(self):
        # 3 pages
        # The first red row of the table fits entirely on the first page.
        # The second green row begins on the second page,
        # but due to service break labels it doesn’t fit completely,
        # so its two green content lines are moved to the final third page,
        # where they appear together with the last blue row, which fits entirely.
        self.helper.do_open(case1_html_file_url)
        self.helper.assert_document_has_pages(3)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R11"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="G0"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G9"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_0"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_7"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G10"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G11"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 3)

    def test_2(self):
        # 4 pages
        # The first page contains an element that pushes the table downward,
        # so only two red content lines fit on the 1st page.
        # The remaining red line continues on the 2nd page.
        # The second green row begins on the 3rd page,
        # but due to service break labels it doesn’t fit completely,
        # so its two green content lines are moved to the final 4rd page,
        # where they appear together with the last blue row, which fits entirely.
        self.helper.do_open(case2_html_file_url)
        self.helper.assert_document_has_pages(4)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R1"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="R2"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="R11"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G9"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_7"]', 3)
        # 4
        self.helper.assert_element_on_the_page('//*[@data-testid="G10"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G11"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 4)

    def test_3(self):
        # 4 pages
        # Same as in test_2, but a different partitioning.
        self.helper.do_open(case3_html_file_url)
        self.helper.assert_document_has_pages(4)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R6"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R_0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R_6"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="R7"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="R11"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G0"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G3"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_0"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_3"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G4"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G11"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_4"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_7"]', 3)
        # 4
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 4)

    def test_4(self):
        # 4 pages
        # The second row contains a large unbreakable object.
        # It is expected that it will be transformed, and the second row
        # will occupy the entire second page, the rest of the rows
        # will be distributed as in the base variant.
        self.helper.do_open(case4_html_file_url)
        self.helper.assert_document_has_pages(4)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R11"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="box"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G9"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_7"]', 3)
        # 4
        self.helper.assert_element_on_the_page('//*[@data-testid="G10"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G11"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 4)

    def test_5(self):
        # 6 pages
        # The service element moves the beginning of the table downwards.
        # But the first line has a large unbreakable object that will be reduced
        # (to the minimum extent necessary).
        # So the whole table is moved to a new page, because the first row with
        # the object wants to occupy the maximum space (a whole page).
        self.helper.do_open(case5_html_file_url)
        self.helper.assert_document_has_pages(6)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="pusher"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="box"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="R9"]', 3)
        # 4
        self.helper.assert_element_on_the_page('//*[@data-testid="R10"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="R11"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G0"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G6"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_0"]', 4)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_6"]', 4)
        # 5
        self.helper.assert_element_on_the_page('//*[@data-testid="G7"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="G11"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_7"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="B3"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="B_0"]', 5)
        self.helper.assert_element_on_the_page('//*[@data-testid="B_3"]', 5)
        # 6
        self.helper.assert_element_on_the_page('//*[@data-testid="B4"]', 6)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 6)

    def test_6(self):
        # 2 pages
        # The first line leaves a blank space on the 1st page.
        # But the second row contains a large unbreakable object.
        # It is expected that it will be transformed, and the second row
        # will occupy the entire 2nd page.
        self.helper.do_open(case6_html_file_url)
        self.helper.assert_document_has_pages(2)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="box"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 2)

    # TODO: Not implemented: #unbreakableOversized
        # on the first and last row of the table the element will be scaled
        # with a smaller coefficient than in the middle (due to break service
        # labels - there are probably none at the beginning and end).

    def test_10(self):
        # 3 pages.

        # Case on the 1st page:
        # * Accurate height budget calculation.
        # if (filler's height = 99px [Chrome] / 98px [FF])
        # => 1st page has 5 lines
        # else if (filler's height +2px [Chrome] / +1px [FF]) -> 4 lines on 1st page
        # * use 98 in the test

        # Case on the last (3rd) page:
        # * Without a closing label in the last part.
        # The label “(table continues on the next page)” does not appear on the
        # last part of the table and is not included in the budget calculations.
        # Therefore, the last blue row B5 will not be moved to the 4th page,
        # but will occupy this place at the end of the 3rd page.

        self.helper.do_open(case10_html_file_url)
        self.helper.assert_document_has_pages(3)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="R_0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R_4"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="R4"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="R_5"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="R5"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G4"]', 2)
        self.helper.assert_element_on_the_page('//*[@data-testid="G_4"]', 2)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G_5"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G5"]', 3)
        # The last line B5 is here:
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 3)

    def test_11(self):
        # 3 pages.
        self.helper.do_open(case11_html_file_url)
        self.helper.assert_document_has_pages(3)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G_5"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G5"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="B4"]', 3)
        # The last TR "A" (1 line) is here:
        self.helper.assert_element_on_the_page('//*[@data-testid="A_0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="A0"]', 3)

    def test_12(self):
        # 3 pages.
        self.helper.do_open(case12_html_file_url)
        self.helper.assert_document_has_pages(4)
        # 3
        self.helper.assert_element_on_the_page('//*[@data-testid="G_5"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="G5"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="B4"]', 3)
        # 4
        # The last TR "A" (4 lines) is here in its entirety:
        self.helper.assert_element_on_the_page('//*[@data-testid="A_0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="A0"]', 3)
        self.helper.assert_element_on_the_page('//*[@data-testid="A3"]', 3)
