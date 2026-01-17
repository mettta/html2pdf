import os

from seleniumbase import BaseCase

from test.end2end.helpers.helper import Helper

path_to_this_test_file_folder = os.path.dirname(os.path.abspath(__file__))

page_start = '//*[@data-testid="page_start"]'
lazy_image = '//*[@data-testid="lazy_image"]'
sanitize_style = '//style[@data-html2pdf-sanitize]'
data_src_image = '//*[@data-testid="data_src_image"]'
data_srcset_image = '//*[@data-testid="data_srcset_image"]'
picture_source = '//*[@data-testid="picture_source"]'
data_lazy_src_image = '//*[@data-testid="data_lazy_src_image"]'
data_original_image = '//*[@data-testid="data_original_image"]'
data_url_image = '//*[@data-testid="data_url_image"]'
data_lazy_srcset_image = '//*[@data-testid="data_lazy_srcset_image"]'
picture_lazy_source = '//*[@data-testid="picture_lazy_source"]'
picture_source_1 = '//*[@data-testid="picture_source_1"]'
picture_source_2 = '//*[@data-testid="picture_source_2"]'
contained_block = '//*[@data-testid="contained_block"]'

class Test(BaseCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = Helper(self)

    def test001(self):
        self.helper.open_case(path_to_this_test_file_folder, 'lazy')
        self.helper.assert_element_starts_page(page_start, 10)
        self.helper.assert_element_attribute_equals(lazy_image, 'loading', 'eager')

    def test002(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_src')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_src_image, 'src', 'test-img-sm.png')

    def test003(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_srcset')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_srcset_image, 'srcset', 'test-img-sm.png')

    def test004(self):
        self.helper.open_case(path_to_this_test_file_folder, 'picture_srcset')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(picture_source, 'srcset', 'test-img-sm.png')

    def test005(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_lazy_src')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_lazy_src_image, 'src', 'test-img-sm.png')

    def test006(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_original')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_original_image, 'src', 'test-img-sm.png')

    def test007(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_url')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_url_image, 'src', 'test-img-sm.png')

    def test008(self):
        self.helper.open_case(path_to_this_test_file_folder, 'data_lazy_srcset')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(data_lazy_srcset_image, 'srcset', 'test-img-sm.png')

    def test009(self):
        self.helper.open_case(path_to_this_test_file_folder, 'picture_lazy_srcset')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(picture_lazy_source, 'srcset', 'test-img-sm.png')

    def test010(self):
        self.helper.open_case(path_to_this_test_file_folder, 'picture_multi_source')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_element_attribute_contains(picture_source_1, 'srcset', 'test-img-sm.png')
        self.helper.assert_element_attribute_contains(picture_source_2, 'srcset', 'test-img.png')

    def test012(self):
        self.helper.open_case(path_to_this_test_file_folder, 'contain_size')
        self.helper.assert_element_starts_page(page_start, 2)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_style_contains_text(sanitize_style, 'textContent', 'contain: none !important')

    def test012(self):
        self.helper.open_case(path_to_this_test_file_folder, 'content_visibility_auto')
        self.helper.assert_element_starts_page(page_start, 4)
        self.helper.assert_element(sanitize_style)
        self.helper.assert_style_contains_text(sanitize_style, 'textContent', 'content-visibility: visible !important')

    # def test013(self):
    #     # have no relevant fixture fo the case
    #     self.helper.open_case(path_to_this_test_file_folder, 'contain_content')
    #     self.helper.assert_element(sanitize_style)
    #     self.helper.assert_style_contains_text(sanitize_style, 'textContent', 'contain: none !important')
