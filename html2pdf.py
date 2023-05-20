import argparse
import base64
import json
import os.path
import pathlib

from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def send_devtools(driver, cmd, params):
    resource = "/session/%s/chromium/send_command_and_get_result" % driver.session_id
    url = driver.command_executor._url + resource
    body = json.dumps({'cmd': cmd, 'params': params})
    response = driver.command_executor._request('POST', url, body)
    return response.get('value')


def get_pdf_from_html(driver, url, output_file):
    driver.get(url)

    calculated_print_options = {
        'landscape': False,
        'displayHeaderFooter': False,
        'printBackground': True,
        'preferCSSPageSize': True,
    }

    result = send_devtools(driver, "Page.printToPDF", calculated_print_options)
    data = base64.b64decode(result['data'])
    with open(output_file, "wb") as f:
        f.write(data)


def main():
    parser = argparse.ArgumentParser(description='Description of your program')
    parser.add_argument('input_file', help='Path to HTML file.')
    parser.add_argument('output_file', help='Path to PDF file.')
    args = parser.parse_args()

    input_file = args.input_file
    assert os.path.isfile(input_file)

    output_file = args.output_file
    output_file_dir = os.path.dirname(output_file)
    pathlib.Path(output_file_dir).mkdir(parents=True, exist_ok=True)

    url = pathlib.Path(os.path.abspath(input_file)).as_uri()
    webdriver_options = Options()
    webdriver_options.add_argument("--no-sandbox")
    webdriver_options.add_argument('--headless')
    webdriver_options.add_argument('--disable-gpu')

    chromedriver_exec="./chromedriver"
    driver = webdriver.Chrome(chromedriver_exec, options=webdriver_options)
    get_pdf_from_html(driver, url, output_file)
    driver.quit()


main()
