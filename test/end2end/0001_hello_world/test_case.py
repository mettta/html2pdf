import os
from pathlib import Path

from pypdf import PdfReader
from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))
fixture = (
    "file:///" + os.path.join(path_to_this_test_file_folder, "index.html")
)


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test_001(self):
        self.helper.do_open_and_assert(fixture, "Hello world!", verify_logs=True)
        self.helper.assert_html2pdf_elements()
        self.helper.assert_html2pdf_success()

        Path("output").mkdir(parents=True, exist_ok=True)
        self.helper.do_print_page_to_pdf("output/index.pdf")

        reader = PdfReader("output/index.pdf")
        assert len(reader.pages) == 1

        page0_text = reader.pages[0].extract_text()
        assert page0_text == "Hello world!", page0_text
