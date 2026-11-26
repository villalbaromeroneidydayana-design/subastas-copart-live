import win32com.client
import os

word = win32com.client.Dispatch('Word.Application')
word.Visible = False

files = [
    ('d:\\SUBASTAS\\CONTRATO_EDWIN_RIVAS_SEQUOIA_2025.docx', 'd:\\SUBASTAS\\CONTRATO_EDWIN_RIVAS_SEQUOIA_2025.pdf'),
    ('d:\\SUBASTAS\\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.docx', 'd:\\SUBASTAS\\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.pdf')
]

for doc_path, pdf_path in files:
    if os.path.exists(doc_path):
        doc = word.Documents.Open(os.path.abspath(doc_path))
        doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17) # wdFormatPDF = 17
        doc.Close()
        print(f'Converted {doc_path} -> {pdf_path}')
        
        # Copy to public
        pub_pdf = os.path.join('d:\\SUBASTAS\\public', os.path.basename(pdf_path))
        import shutil
        shutil.copy2(pdf_path, pub_pdf)
        print(f'Copied to {pub_pdf}')

word.Quit()
print('All PDFs generated successfully!')
