import base64
import os

from selenium.webdriver.common.by import By
from seleniumbase import BaseCase

# Elements should appear in the DOM on success:
# only once
_root_ = '//html2pdf-root'
_content_flow_ = '//html2pdf-content-flow'
_content_flow_start_ = '//html2pdf-content-flow-start'
_content_flow_end_ = '//html2pdf-content-flow-end'
_paper_flow_ = '//html2pdf-paper-flow'
# in number of printed pages
_page_start_ = _content_flow_ + '//html2pdf-page'
_paper_ = _paper_flow_ + '/html2pdf-virtual-paper'
_paper_body_ = _paper_ + '/html2pdf-page-body-spacer'
_paper_header_ = _paper_ + '/html2pdf-page-header'
_paper_footer_ = _paper_ + '/html2pdf-page-footer'

# Elements with content, empty ones don't appear
# _frontpage_content_ = _paper_flow_ + '//html2pdf-frontpage'
# _header_content_ = _paper_flow_ + '//html2pdf-header'
# _footer_content_ = _paper_flow_ + '//html2pdf-footer'

# --- Local file URL helpers ---------------------------------------------------

def make_file_url(base_folder: str, filename: str) -> str:
    """Build a file:/// URL for a given filename residing in base_folder.

    Example:
        make_file_url("/path/to/cases", "case001.html")
        -> "file:////path/to/cases/case001.html"
    """
    return f"file:///{os.path.join(base_folder, filename)}"


def case_url_num(base_folder: str, n: int, prefix: str = "case", ext: str = "html") -> str:
    """Build a canonical test-case URL like case001.html in base_folder.

    Args:
        base_folder: directory that contains the HTML fixtures
        n: case number (will be zero‑padded to 3 digits)
        prefix: filename prefix (default: "case")
        ext: file extension (default: "html")

        Format f"case{n:03}.html":
        n = 1  → case001.html
        n = 10 → case010.html
        n = 100 → case100.html
    """
    return make_file_url(base_folder, f"{prefix}{n:03}.{ext}")

def case_url(base_folder: str, n, prefix: str = "case", ext: str = "html") -> str:
    # n is str: "001", "010", "100" ... → case_001.html
    return make_file_url(base_folder, f"{prefix}_{n}.{ext}")

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

    def do_print_page_to_pdf(self, path_to_output_pdf: str) -> None:
        """
        Uses Chrome DevTools Protocol to save the current page as PDF.
        """

        driver = self.test_case.driver

        # Ensure your driver is Chrome
        if "chrome" not in driver.capabilities["browserName"].lower():
            raise RuntimeError("PDF printing only works in Chrome")

        # Send command to Chrome
        result = driver.execute_cdp_cmd("Page.printToPDF", {
            "printBackground": True,  # Include background graphics
            "landscape": False,  # Portrait mode
            "paperWidth": 8.27,  # A4 width in inches
            "paperHeight": 11.69,  # A4 height in inches
        })

        # Save PDF
        pdf_data = base64.b64decode(result["data"])
        with open(path_to_output_pdf, "wb") as f:
            f.write(pdf_data)
        print(f"PDF saved to {path_to_output_pdf}")

    def open_case_num(self, base_folder: str, n: int, prefix: str = "case", ext: str = "html") -> None:
        """Open a numbered HTML test case from base_folder.

        Example usage in tests:
            self.helper.open_case(path_to_this_test_file_folder, 1)
            OR
            self.helper.open_case(path_to_this_test_file_folder, 7, prefix="grid", ext="htm")
            # -> file:///.../grid007.htm
        """
        self.do_open(case_url(base_folder, n, prefix, ext))

    def open_case(self, base_folder: str, n: str, prefix: str = "case", ext: str = "html") -> None:
        self.do_open(case_url(base_folder, n, prefix, ext))

    # html2pdf elements

    def assert_html2pdf_elements(self) -> None:
        self.test_case.assert_element_present(_root_, by=By.XPATH)

        self.test_case.assert_element_present(_content_flow_, by=By.XPATH)
        self.test_case.assert_element_present(_content_flow_start_, by=By.XPATH)
        self.test_case.assert_element_present(_content_flow_end_, by=By.XPATH)
        self.test_case.assert_element_present(_page_start_, by=By.XPATH)

        self.test_case.assert_element_present(_paper_flow_, by=By.XPATH)
        self.test_case.assert_element_present(_paper_, by=By.XPATH)
        self.test_case.assert_element_present(_paper_body_, by=By.XPATH)
        self.test_case.assert_element_present(_paper_header_, by=By.XPATH)
        self.test_case.assert_element_present(_paper_footer_, by=By.XPATH)

    def assert_html2pdf_success(self) -> None:
        self.test_case.assert_attribute(_root_, 'success')

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
            f'{_page_start_}',
            by=By.XPATH,
        )
        return len(all_pages)

    def assert_document_has_pages(self, count: int, report: bool = False) -> None:
        paper = self._get_amount_of_virtual_paper()
        pages = self._get_amount_of_virtual_pages()
        if report:
            print('-> paper:', paper)
            print('-> pages:', pages)
        assert paper == count, f"{paper} == {count}, pages: {pages}"
        assert pages == count, f"{pages} == {count}, paper: {paper}"

    # Element

    def assert_element_contains(self, element_xpath, text: str) -> None:
        self.test_case.assert_element(
            f"{element_xpath}"
            f"//*[contains(., '{text}')]",
            by=By.XPATH,
        )

    def assert_element_has_attribute(self, element_xpath, attribute: str) -> None:
        target = self.test_case.find_element(
            f'{_content_flow_}{element_xpath}',
            by=By.XPATH,
        )
        attr_value = self.test_case.get_attribute(
            f'{_content_flow_}{element_xpath}',
            attribute,
            by=By.XPATH
        )
        assert attr_value is not None, \
            f"Expected element to have [{attribute}]"

    def assert_element_starts_page(self, element_xpath: str, page_number: int, element_order: int = 1) -> None:
        attr_value = self.test_case.get_attribute(
            f'({_content_flow_}{element_xpath})[{element_order}]',
            'html2pdf-page-start',
            by=By.XPATH
        )
        expected = str(page_number)
        assert attr_value == expected, f"Expected html2pdf-page-start='{expected}', got '{attr_value}'"

    def assert_element_on_the_page(self, element_xpath, page_number, report: bool = False) -> None:
        # Check that the Test object is shifted to the specific page.
        # That is, it is lower than the top of the specific page.
        element = self.test_case.find_element(
            f'{_content_flow_}{element_xpath}',
            by=By.XPATH,
        )
        element_y = element.location["y"]
        # pages
        pages = self._get_amount_of_virtual_pages()
        # page_anchor
        if page_number == 1:
            page_anchor = self.test_case.find_element(
                f'{_page_start_}[@page="{page_number}"]',
                by=By.XPATH,
            )
        else:
            page_anchor = self.test_case.find_element(
                f'{_page_start_}[@page="{page_number}"]/html2pdf-virtual-paper-gap',
                by=By.XPATH,
            )
        page_y = page_anchor.location["y"]
        # next_page_anchor
        if page_number < pages:
            next_page_anchor = self.test_case.find_element(
                f'{_page_start_}[@page="{page_number + 1}"]/html2pdf-virtual-paper-gap',
                by=By.XPATH,
            )
            next_page_y = next_page_anchor.location["y"]
        else:
            next_page_y = None

        if next_page_y is not None:
            cond1 = page_y < element_y
            cond2 = next_page_y > element_y
            if report:
                print('-> page_y: ', page_y)
                print('-> element_y: ', element_y)
                print('-> next_page_y: ', next_page_y)
            assert cond1 & cond2
        else:
            # The last page
            cond1 = page_y < element_y
            if report:
                print('-> page_y: ', page_y)
                print('-> element_y: ', element_y)
            assert cond1

    # Element direct children

    def assert_direct_children_absent(self, parent_xpath: str, child_xpaths) -> None:
        """
        Assert that the parent element does not have the specified direct children.

        Args:
            parent_xpath: XPath of the parent element
            child_xpaths: list of XPath expressions for direct children to check absence of
        """
        parent = self.test_case.find_element(parent_xpath, by=By.XPATH)
        for cx in child_xpaths:
            found = parent.find_elements(By.XPATH, f"./{cx.lstrip('./')}")
            assert len(found) == 0, f"Expected no direct child {cx} under {parent_xpath}"

    def assert_direct_children_present(self, parent_xpath: str, child_xpaths) -> None:
        """
        Assert that the parent element has the specified direct children.

        Args:
            parent_xpath: XPath of the parent element
            child_xpaths: list of XPath expressions for direct children to check presence of
        """
        parent = self.test_case.find_element(parent_xpath, by=By.XPATH)
        for cx in child_xpaths:
            found = parent.find_elements(By.XPATH, f"./{cx.lstrip('./')}")
            assert len(found) > 0, f"Expected direct child {cx} under {parent_xpath}"

    # Element dimensions

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
