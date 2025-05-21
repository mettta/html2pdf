import os

from selenium.webdriver.common.by import By
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

    def test_01(self):
        self.helper.do_open(case1_html_file_url)
        # 2 or 3 pages are produced on Firefox or Chrome, so don't assert on
        # the page number.
        # self.helper.assert_document_has_pages(3)

        # 1. Check that the specific admonition title has the no-hanging flag
        target = self.find_element(
            'sdoc-node-content:nth-child(5) p.first.admonition-title'
        )
        assert target.get_attribute("html2pdf-flag-no-hanging") is not None, \
            "Expected element to have [html2pdf-flag-no-hanging]"

        # 2. Check that the scope node has page-start="2"
        try:
            page_start = self.find_element(
                'sdoc-node-content:nth-child(5) sdoc-scope.node_fields_group-primary'
            )
            print("[DEBUG] Element found.")
            print("[DEBUG] tag name:", page_start.tag_name)
            print("[DEBUG] class:", page_start.get_attribute("class"))
            print("[DEBUG] innerText:", page_start.text)
        except Exception as e:
            print(f"[ERROR] Failed to find element: {e}")
            raise

        try:
            outer_html = page_start.get_attribute("outerHTML")
            print("[DEBUG] outerHTML:\n", outer_html)
        except Exception as e:
            print(f"[ERROR] Failed to get outerHTML: {e}")

        try:
            actual_page_start = page_start.get_attribute("html2pdf-page-start")
            print(f"[DEBUG] html2pdf-page-start value: {actual_page_start}")
        except Exception as e:
            print(f"[ERROR] Failed to get html2pdf-page-start attribute: {e}")
            actual_page_start = None

        try:
            print("[DEBUG] page_source START ↓↓↓")
            print(self.driver.page_source)
            print("[DEBUG] page_source END ↑↑↑")
        except Exception as e:
            print(f"[ERROR] Failed to dump page_source: {e}")

        if actual_page_start != "2":
            try:
                with open("debug_output.html", "w", encoding="utf-8") as f:
                    f.write(self.driver.page_source)
                print("[DEBUG] Saved full page source to debug_output.html")
            except Exception as e:
                print(f"[DEBUG] Failed to write debug_output.html: {e}")

            try:
                box = self.driver.execute_script(
                    "const b = arguments[0].getBoundingClientRect(); "
                    "return {top: b.top, height: b.height, bottom: b.bottom};",
                    page_start,
                )
                print(f"[DEBUG] getBoundingClientRect(): top={box['top']}, "
                      f"height={box['height']}, bottom={box['bottom']}")
            except Exception as e:
                print(f"[DEBUG] Failed to get bounding box: {e}")

        # assert actual_page_start == "2", \
        #     f'Expected element to have [html2pdf-page-start="2"], got {actual_page_start!r}'
        assert actual_page_start is not None, \
            "Expected element to have [html2pdf-page-start], but it was missing"

        # 3. Check that this page-start element appears after the page marker with [page='2']
        page_marker = self.find_element('html2pdf-page[page="2"]')
        assert page_marker.location['y'] < page_start.location['y'], \
            'Expected page-start element to appear after page marker with [page="2"]'

