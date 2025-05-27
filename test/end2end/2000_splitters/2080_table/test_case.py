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
        # TODO: Not implemented: #unbreakableOversized
        # on the first and last row of the table the element will be scaled
        # with a smaller coefficient than in the middle (due to break service
        # labels - there are probably none at the beginning and end).
        self.helper.do_open(case6_html_file_url)
        # TODO: Not implemented: #unbreakableOversized: should has 3 page
        self.helper.assert_document_has_pages(2)
        # 1
        self.helper.assert_element_on_the_page('//*[@data-testid="B0"]', 1)
        self.helper.assert_element_on_the_page('//*[@data-testid="B5"]', 1)
        # 2
        self.helper.assert_element_on_the_page('//*[@data-testid="box"]', 2)
        # TODO: Not implemented: #unbreakableOversized: should be pushed to 3rd page
        self.helper.assert_element_on_the_page('//*[@data-testid="closer"]', 2)
