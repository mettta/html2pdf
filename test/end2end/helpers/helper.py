from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

_content_flow_ = '//*[@id="contentFlow"]'
_paper_flow_ = '//*[@id="paperFlow"]'
_paper_ = '//*[@id="paperFlow"]/*[@class="virtualPaper"]'
_paper_body_ = '//*[@class="paperBody"]'
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

    def do_open_and_assert_title(self, file: str, title: str) -> None:
        self.do_open(file)
        self.test_case.assert_title(title)

    # Pages & Paper

    def get_print_area_height(self) -> int:
        paper_body = self.test_case.find_element(
            f'{_paper_body_}',
            by=By.XPATH,
        )
        return paper_body.size['height']

    def get_print_area_width(self) -> int:
        paper_body = self.test_case.find_elements(
            f'{_paper_body_}',
            by=By.XPATH,
            limit=1
        )
        return paper_body.size['width']

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

    # Element

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
        assert page_top_point.location["y"] <= element.location["y"]

    def assert_element_fit_height(self, element_xpath) -> None:
        # Check if the element fits in the printable area in height
        element = self.test_case.find_element(
            f'{_content_flow_}{element_xpath}',
            by=By.XPATH,
        )
        printAreaHeight = self.get_print_area_height()
        print('printAreaHeight', printAreaHeight)
        elementHeight = self._get_element_height(element)
        print('elementHeight', elementHeight)
        assert elementHeight <= printAreaHeight

    def assert_element_fit_width(self, element_xpath) -> None:
        # Check if the element fits in the printable area by width
        element = self.test_case.find_element(
            f'{_content_flow_}{element_xpath}',
            by=By.XPATH,
        )
        printAreaWidth = self.get_print_area_width()
        elementWidth = self._get_element_width(element)
        assert elementWidth < printAreaWidth

    def _get_element_width(self, element) -> int:
        return element.size['width']

    def _get_element_height(self, element) -> int:
        return element.size['height']

        # /*[@data-content-flow-end]
        # /html2pdf-content-flow-end
