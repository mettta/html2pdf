import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

test_text = "I want to be on page 2."

class Test_T010_SecondPage(BaseCase):
    def test_01(self):
        index_html_file_url = (
            "file:///" +
            os.path.join(path_to_this_test_file_folder, "index.html")
        )
        self.open(index_html_file_url)
        self.assert_no_404_errors()
        self.assert_no_js_errors()

        self.assert_text(test_text)
        self.assert_element(
            '(//*[@id="paperFlow"]/*[@class="virtualPaper"])[2]',
            by=By.XPATH,
        )
        self.assert_element_not_present(
            '(//*[@id="paperFlow"]/*[@class="virtualPaper"])[3]',
            by=By.XPATH,
        )

        # print(dir(element))
        # print(element.location)

        # Check that the Test object is shifted to the second page.
        # That is, it is lower than the top of the second page.
        test_object = self.find_element(
            f'//*[@id="contentFlow"]//*[contains(., "{test_text}")]',
            by=By.XPATH,
        )
        # print(test_object.location)
        page_2_top_point = self.find_element(
            '//*[@id="contentFlow"]//*[@class="virtualPaperTopMargin"][2]',
            by=By.XPATH,
        )
        # print(page_2_top_point.location)
        assert page_2_top_point.location["y"] < test_object.location["y"]

        # Check that two pages are rendered
        all_papers = self.find_elements(
            '(//*[@id="paperFlow"]/*[@class="virtualPaper"])',
            by=By.XPATH,
        )
        assert len(all_papers) == 2

        # /*[@data-content-flow-end]

