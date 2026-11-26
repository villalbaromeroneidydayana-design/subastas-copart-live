import docx, win32com.client, os, shutil, fitz
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

SEAL_IMAGE_PATH = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"
LOGO_IMAGE_PATH = r"d:\SUBASTAS\public\copart_logo_header.png"

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=35, bottom=35, left=55, right=55):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_wire_slip():
    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.40)
    sec.bottom_margin = Inches(0.40)
    sec.left_margin = Inches(0.50)
    sec.right_margin = Inches(0.50)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)

    # 1. Header Table
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    ht.autofit = False
    c1, c2 = ht.rows[0].cells[0], ht.rows[0].cells[1]
    c1.width, c2.width = Inches(3.4), Inches(4.1)

    p_logo = c1.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_l = p_logo.add_run()
        r_l.add_picture(LOGO_IMAGE_PATH, width=Inches(1.85))

    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(3)
    p_sub.paragraph_format.space_after = Pt(0)
    r_s = p_sub.add_run(
        "COPART MEMBER SETTLEMENT & TREASURY DIVISION\n"
        "DEPARTAMENTO DE CARTERA, COBROS Y LIQUIDACIÓN\n"
        "OFICIAL DE CARTERA ASIGNADO: Diego Junior Guzmán González\n"
        "SOPORTE OFICIAL: copartadjudications@gmail.com"
    )
    r_s.font.name = "Arial"
    r_s.font.size = Pt(7.2)
    r_s.font.bold = True
    r_s.font.color.rgb = RGBColor(71, 85, 105)

    p_meta = c2.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    r_m = p_meta.add_run(
        "ORDEN OFICIAL DE LIQUIDACIÓN BANCARIA (WIRE TRANSFER)\n"
        "FOLIO DE PAGO: WIRE-TX-67797166-SETTLE\n"
        "FECHA DE EMISIÓN: 23 de Noviembre de 2026\n"
        "MODALIDAD: WIRE TRANSFER INMEDIATO (ACREDITACIÓN DIRECTA)"
    )
    r_m.font.name = "Arial"
    r_m.font.size = Pt(8.0)
    r_m.font.bold = True
    r_m.font.color.rgb = RGBColor(11, 46, 89)

    # Gold divider bar
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(4)
    p_div.paragraph_format.space_after = Pt(4)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 68)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(9.5)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6)

    # Title
    pt = doc.add_paragraph()
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(2)
    rt = pt.add_run("INSTRUCCIONES OFICIALES DE TRANSFERENCIA BANCARIA (WIRE TRANSFER)")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(11.5)
    rt.font.color.rgb = RGBColor(11, 46, 89)

    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(6)
    rts = ps.add_run("LIQUIDACIÓN DE ADJUDICACIÓN DE VEHÍCULO • EMISIÓN INMEDIATA DE GATE PASS Y TÍTULO")
    rts.font.name = "Arial"
    rts.font.size = Pt(8.8)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(16, 122, 60)

    # Vehicle and Client Summary Table
    it = doc.add_table(rows=3, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
    it.autofit = False

    info_rows = [
        ("ADJUDICATARIO / MIEMBRO:", "Gustavo Adolfo Medal López", "ID DE MIEMBRO:", "50192045"),
        ("VEHÍCULO ADJUDICADO:", "2015 Toyota Corolla LE (Sedán)", "LOTE COPART OFICIAL:", "#67797166"),
        ("NÚMERO DE VIN / SERIE:", "2T1BURHE5FC482910", "CIUDAD DE DESTINO:", "Wylie, Texas (TX)")
    ]

    for r_idx, row_d in enumerate(info_rows):
        row = it.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            set_cell_margins(c, 25, 25, 45, 45)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            val = row_d[c_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            if c_idx in (0, 2):
                c.width = Inches(1.85)
                set_cell_background(c, "F1F5F9")
                r.font.size = Pt(8.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                c.width = Inches(1.90)
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(15, 23, 42)

    # Spacing
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(6)
    p_sp.paragraph_format.space_after = Pt(2)

    # Bank Wire Details Big Table
    bt = doc.add_table(rows=7, cols=2)
    bt.alignment = WD_TABLE_ALIGNMENT.CENTER
    bt.autofit = False

    bank_details = [
        ("DATOS DE TRANSFERENCIA BANCARIA (WIRE TRANSFER USA)", "INFORMACIÓN OFICIAL AUTORIZADA"),
        ("NOMBRE DEL TITULAR (Account Holder Name):", "Diego Junior Guzman Gonzalez\n(Copart Cartera & Settlement Services)"),
        ("TIPO DE CUENTA (Account Type):", "Checking Account (Cuenta Corriente)"),
        ("NÚMERO DE CUENTA (Account Number):", "8333912452"),
        ("NÚMERO DE RUTA (Routing Number / ABA):", "026073008"),
        ("NOMBRE DEL BANCO (Bank Name):", "Community Federal Savings Bank"),
        ("DIRECCIÓN DEL BANCO (Bank Address):", "5 Penn Plaza, 14th Floor, New York, NY 10001, US")
    ]

    for r_idx, (col0, col1) in enumerate(bank_details):
        row = bt.rows[r_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(3.2), Inches(4.3)
        set_cell_margins(c0, 28, 28, 50, 50)
        set_cell_margins(c1, 28, 28, 50, 50)
        
        p0, p1 = c0.paragraphs[0], c1.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        p0.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.space_before = Pt(0)

        r0 = p0.add_run(col0)
        r0.font.name = "Arial"
        r1 = p1.add_run(col1)
        r1.font.name = "Arial"

        if r_idx == 0:
            set_cell_background(c0, "0B2E59")
            set_cell_background(c1, "0B2E59")
            r0.font.size = Pt(8.5)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(255, 255, 255)
            r1.font.size = Pt(8.5)
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(251, 191, 36)
        else:
            set_cell_background(c0, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_background(c1, "FFFFFF" if r_idx % 2 == 1 else "F8FAFC")
            r0.font.size = Pt(8.3)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(30, 41, 59)

            if r_idx in (3, 4): # Account & Routing Number
                r1.font.name = "Arial Black"
                r1.font.size = Pt(11.0)
                r1.font.bold = True
                r1.font.color.rgb = RGBColor(11, 46, 89)
            elif r_idx == 1: # Holder Name
                r1.font.size = Pt(9.2)
                r1.font.bold = True
                r1.font.color.rgb = RGBColor(15, 23, 42)
            else:
                r1.font.size = Pt(8.5)
                r1.font.color.rgb = RGBColor(51, 65, 85)

    # Highlight Total Box
    p_tot = doc.add_paragraph()
    p_tot.paragraph_format.space_before = Pt(6)
    p_tot.paragraph_format.space_after = Pt(4)
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_tl = p_tot.add_run("MONTO EXACTO A TRANSFERIR (WIRE): ")
    r_tl.font.name = "Arial"
    r_tl.font.size = Pt(10.5)
    r_tl.font.bold = True
    r_tl.font.color.rgb = RGBColor(15, 23, 42)

    r_tv = p_tot.add_run(" $2,448.00 USD")
    r_tv.font.name = "Arial Black"
    r_tv.font.size = Pt(14.0)
    r_tv.font.bold = True
    r_tv.font.color.rgb = RGBColor(16, 122, 60)

    # Mandatory Reference Box
    p_ref = doc.add_paragraph()
    p_ref.paragraph_format.space_before = Pt(0)
    p_ref.paragraph_format.space_after = Pt(6)
    p_ref.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_rf = p_ref.add_run("★ REFERENCIA O CONCEPTO OBLIGATORIO DE LA TRANSFERENCIA: ")
    r_rf.font.name = "Arial"
    r_rf.font.size = Pt(8.5)
    r_rf.font.bold = True
    r_rf.font.color.rgb = RGBColor(185, 28, 28)

    r_rfv = p_ref.add_run("LOTE 67797166 - GUSTAVO MEDAL")
    r_rfv.font.name = "Arial Black"
    r_rfv.font.size = Pt(9.5)
    r_rfv.font.bold = True
    r_rfv.font.color.rgb = RGBColor(11, 46, 89)

    # Bottom Instructions & Seal
    btm_table = doc.add_table(rows=1, cols=2)
    btm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    btm_table.autofit = False

    bc1, bc2 = btm_table.rows[0].cells[0], btm_table.rows[0].cells[1]
    bc1.width, bc2.width = Inches(4.3), Inches(3.2)
    set_cell_background(bc1, "F1F5F9")
    set_cell_background(bc2, "F8FAFC")
    set_cell_margins(bc1, 30, 30, 45, 45)
    set_cell_margins(bc2, 30, 30, 45, 45)

    p_bi = bc1.paragraphs[0]
    p_bi.paragraph_format.space_before = Pt(0)
    p_bi.paragraph_format.space_after = Pt(0)
    p_bi.paragraph_format.line_spacing = 1.15
    r_bi = p_bi.add_run(
        "PROCEDIMIENTO DE LIBERACIÓN Y RETIRO:\n"
        "1. Realice la transferencia Wire desde su aplicación bancaria o ventanilla (Chase, Wells Fargo, BofA, etc.).\n"
        "2. Envíe el comprobante digital al correo: copartadjudications@gmail.com o a su asesor por WhatsApp.\n"
        "3. El sistema concilia el depósito de inmediato y emite el GATE PASS OFICIAL de salida.\n"
        "4. Se despacha la grúa plataforma desde Copart Houston South (Yard #10) directo a Wylie, TX.\n"
        "5. El vehículo se entrega con Título Limpio original de Texas y Placa Provisional de 30 días."
    )
    r_bi.font.name = "Arial"
    r_bi.font.size = Pt(7.3)
    r_bi.font.color.rgb = RGBColor(30, 41, 59)

    p_bs = bc2.paragraphs[0]
    p_bs.paragraph_format.space_before = Pt(0)
    p_bs.paragraph_format.space_after = Pt(0)
    p_bs.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_bsl = p_bs.add_run("SELLO OFICIAL DE LIQUIDACIONES COPART:\n")
    r_bsl.font.name = "Arial"
    r_bsl.font.size = Pt(7.3)
    r_bsl.font.bold = True
    r_bsl.font.color.rgb = RGBColor(11, 46, 89)

    if os.path.exists(SEAL_IMAGE_PATH):
        r_bimg = p_bs.add_run()
        r_bimg.add_picture(SEAL_IMAGE_PATH, width=Inches(3.1))

    p_bsm = bc2.add_paragraph()
    p_bsm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bsm.paragraph_format.space_before = Pt(2)
    p_bsm.paragraph_format.space_after = Pt(0)
    r_bsmt = p_bsm.add_run("Departamento de Cartera & Liquidación de Miembros\nCopart Settlement Services • Houston South Yard #10")
    r_bsmt.font.name = "Arial"
    r_bsmt.font.size = Pt(6.8)
    r_bsmt.font.bold = True
    r_bsmt.font.color.rgb = RGBColor(11, 46, 89)

    # Footer Hash
    p_fh = doc.add_paragraph()
    p_fh.paragraph_format.space_before = Pt(4)
    p_fh.paragraph_format.space_after = Pt(0)
    p_fh.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_fh = p_fh.add_run("ATOMIC WIRE SETTLEMENT HASH: CP-WIRE-026073008-8333912452-TX • COPART TREASURY DEPT")
    r_fh.font.name = "Courier New"
    r_fh.font.size = Pt(6.5)
    r_fh.font.bold = True
    r_fh.font.color.rgb = RGBColor(100, 116, 139)

    docx_path = r"d:\SUBASTAS\FICHA_PAGO_WIRE_COPART_GUSTAVO_MEDAL.docx"
    pdf_path = r"d:\SUBASTAS\FICHA_PAGO_WIRE_COPART_GUSTAVO_MEDAL.pdf"
    doc.save(docx_path)
    print(f"Created DOCX: {docx_path}")

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    d = word.Documents.Open(os.path.abspath(docx_path))
    d.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
    d.Close()
    word.Quit()

    pub_pdf = os.path.join(r"d:\SUBASTAS\public", os.path.basename(pdf_path))
    shutil.copy2(pdf_path, pub_pdf)

    doc_fitz = fitz.open(pdf_path)
    print(f"Generated PDF: {pdf_path} (Pages: {len(doc_fitz)})")

    # Render Preview
    pix = doc_fitz[0].get_pixmap(dpi=150)
    pix.save(r"d:\SUBASTAS\public\ficha_wire_preview.png")
    print("Rendered preview image.")

if __name__ == "__main__":
    create_wire_slip()
