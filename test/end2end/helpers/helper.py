from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

_content_flow_ = '//*[@id="contentFlow"]'
_paper_flow_ = '//*[@id="paperFlow"]'
_paper_ = '//*[@id="paperFlow"]/*[@class="virtualPaper"]'
_page_top_point_ = '(//*[@id="contentFlow"]//*[@class="virtualPaperTopMargin"])'

class Helper:
    def __init__(self, test_case: BaseCase) -> None:
        assert isinstance(test_case, BaseCase)
        self.test_case: BaseCase = test_case

    def do_open(self, file: str) -> None:
        self.test_case.open(file)
        self.test_case.assert_no_404_errors()
        self.test_case.assert_no_js_errors()

    def do_open_and_assert(self, file: str, text: str) -> None:
        self.do_open(file)
        self.test_case.assert_text(text)

    # Pages & Paper

    def _get_amount_of_virtual_paper(self) -> int:
        all_papers = self.test_case.find_elements(
            f'{_paper_}',
            by=By.XPATH,
        )
        return len(all_papers)

    def _get_amount_of_virtual_pages(self) -> int:
        all_pages = self.test_case.find_elements(
            f'{_page_top_point_}',
            by=By.XPATH,
        )
        return len(all_pages)

    def assert_document_has_pages(self, count: int, report: bool = False) -> None:
        paper = self._get_amount_of_virtual_paper()
        pages = self._get_amount_of_virtual_pages()
        if report:
            print('-> paper:', paper)
            print('-> pages:', pages)
        assert paper == count
        assert pages == count

    # Element position

    def assert_element_on_the_page(self, element_xpath, page_number, report: bool = False) -> None:
        # Check that the Test object is shifted to the specific page.
        # That is, it is lower than the top of the specific page.
        element = self.test_case.find_element(
            f'{_content_flow_}{element_xpath}',
            by=By.XPATH,
        )
        page_top_point = self.test_case.find_element(
            f'{_page_top_point_}[{page_number}]',
            by=By.XPATH,
        )
        if report:
            print('-> page_top_point: ', page_top_point.location["y"])
            print('-> element: ', element.location["y"])
        assert page_top_point.location["y"] < element.location["y"]

        # /*[@data-content-flow-end]
