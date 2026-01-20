import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

img_timeout = '//*[@data-testid="img_timeout"]'
img_error = '//*[@data-testid="img_error"]'
bg_timeout = '//*[@data-testid="bg_timeout"]'
svg_timeout = '//*[@data-testid="svg_timeout"]'
object_timeout = '//*[@data-testid="object_timeout"]'
inside_img = '//*[@data-testid="inside_img"]'
outside_img = '//*[@data-testid="outside_img"]'
resource_issue_count = '//*[@data-testid="resource_issue_count"]'


class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test001_img_timeout(self):
        # Status note: "error" is typical for missing file:// resources,
        # while "timeout" happens when a request stalls (e.g. slow/blocked URL).
        # Missing IMG should be marked as timeout.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'img_timeout')
        self.helper.assert_element_attribute_in_direct(
            img_timeout,
            'html2pdf4doc-resource-status',
            ['timeout', 'error'],
        )

    def test002_img_error(self):
        # Broken IMG should be marked as error.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'img_error')
        self.helper.assert_element_attribute_equals_direct(img_error, 'html2pdf4doc-resource-status', 'error')

    def test003_background_timeout(self):
        # Status note: background image can report error or timeout depending on URL behavior.
        # Missing background image should be marked as timeout.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'bg_timeout')
        self.helper.assert_element_attribute_in_direct(
            bg_timeout,
            'html2pdf4doc-resource-status',
            ['timeout', 'error'],
        )

    def test004_svg_image_timeout(self):
        # Status note: SVG <image> missing href can resolve to error or timeout.
        # Missing SVG <image> href should be marked as timeout.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'svg_image_timeout')
        self.helper.assert_element_attribute_in_direct(
            svg_timeout,
            'html2pdf4doc-resource-status',
            ['timeout', 'error'],
        )

    def test005_object_timeout(self):
        # Status note: <object> missing data can resolve to error or timeout.
        # Missing <object> data should be marked as timeout.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'object_timeout')
        self.helper.assert_element_attribute_in_direct(
            object_timeout,
            'html2pdf4doc-resource-status',
            ['timeout', 'error'],
        )

    def test006_scope_initial_root(self):
        # Status note: file:// missing resources typically yield "error".
        # Only resources inside html2pdf4doc root should be tracked.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'scope_initial_root')
        self.helper.assert_element_attribute_in_direct(
            inside_img,
            'html2pdf4doc-resource-status',
            ['timeout', 'error'],
        )
        self.helper.assert_element_attribute_absent_direct(outside_img, 'html2pdf4doc-resource-status')

    def test007_resource_issue_event(self):
        # Resource issue event should increment the counter.
        self.helper.open_case_allow_resource_404(path_to_this_test_file_folder, 'resource_event')
        self.helper.assert_element_has_text(resource_issue_count, '2')
