from pypdf import PdfReader

reader = PdfReader("Output/index.pdf")

assert len(reader.pages) == 2

assert reader.pages[0].extract_text() == "Hello world!"
assert reader.pages[1].extract_text() == "Hello world!"
