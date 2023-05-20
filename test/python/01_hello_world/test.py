import pikepdf as pikepdf

with pikepdf.open('Output/index.pdf') as pdf:
    assert len(pdf.pages) == 1
