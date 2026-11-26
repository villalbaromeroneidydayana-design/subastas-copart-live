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

def set_cell_margins(cell, top=28, bottom=28, left=45, right=45):
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

def generate_invoice():
    invoice_no = "INV-2026-CA-76061096"
    date_str = "25 de Noviembre de 2026"
    client_name = "Johan Vladimir Rajo Arias"
    client_id = "DL W1947766 (California)"
    client_loc = "1800 W. Gramercy Ave Apt 54, Anaheim, CA 92801"
    client_email = "Johanvladimirrajoarias@gmail.com"
    client_phone = "+1 (714) 272-1351"
    lot_number = "76061096"
    vin = "4T1T11AK8NU519082"
    vehicle_desc = "2022 TOYOTA CAMRY SE SPORT EDITION (99,960 mi)"
    title_type = "CA - CLEAN TITLE + Placa Provisional (30 Días)"
    hammer_price = 6150.0
    output_docx_path = r"d:\SUBASTAS\FACTURA_COPART_JOHAN_VLADIMIR_CAMRY_2022.docx"

    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.35)
    sec.bottom_margin = Inches(0.35)
    sec.left_margin = Inches(0.50)
    sec.right_margin = Inches(0.50)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)

    # 1. Header Table (2 columns: 3.3 in + 4.1 in = 7.4 in)
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    ht.autofit = False
    c1, c2 = ht.rows[0].cells[0], ht.rows[0].cells[1]
    c1.width, c2.width = Inches(3.30), Inches(4.10)

    p_logo = c1.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_l = p_logo.add_run()
        r_l.add_picture(LOGO_IMAGE_PATH, width=Inches(1.85))

    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(0)
    r_s = p_sub.add_run(
        "COPART MEMBER SERVICES & TITLE SETTLEMENT\n"
        "PATIO DE ORIGEN: Copart Van Nuys (Yard #106 / California)\n"
        "DIRECCIÓN PATIO: 16161 Raymer St, Van Nuys, CA 91406\n"
        "SOPORTE DE LIQUIDACIÓN: member.settlement@copart.com"
    )
    r_s.font.name = "Arial"
    r_s.font.size = Pt(7.0)
    r_s.font.bold = True
    r_s.font.color.rgb = RGBColor(71, 85, 105)

    p_meta = c2.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    r_m = p_meta.add_run(
        f"FACTURA OFICIAL DE ADJUDICACIÓN / BILL OF SALE\n"
        f"FACTURA N°: {invoice_no} | FECHA: {date_str}\n"
        f"POSTOR TITULAR / PADDLE: PALETA OFICIAL #101\n"
        f"ESTADO DE SUBASTA: ADJUDICADO / SOLD (LOTE GANADO)"
    )
    r_m.font.name = "Arial"
    r_m.font.size = Pt(8.0)
    r_m.font.bold = True
    r_m.font.color.rgb = RGBColor(11, 46, 89)

    # Gold divider bar
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(3)
    p_div.paragraph_format.space_after = Pt(3)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 74)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(8.5)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6)

    # Title
    pt = doc.add_paragraph()
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(1)
    rt = pt.add_run("CERTIFICADO OFICIAL DE ADJUDICACIÓN Y LIQUIDACIÓN DE SUBASTA")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(11.0)
    rt.font.color.rgb = RGBColor(11, 46, 89)

    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(4)
    rts = ps.add_run("ORDEN DE COMPRA LEGAL Y AUTORIZACIÓN DE RETIRO DE PATIO (GATE PASS)")
    rts.font.name = "Arial"
    rts.font.size = Pt(8.5)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(16, 122, 60)

    # 2. Buyer & Vehicle Information Table (4 cols: 1.80 + 1.90 + 1.80 + 1.90 = 7.40 in)
    it = doc.add_table(rows=5, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
    it.autofit = False
    it_col_widths = [Inches(1.80), Inches(1.90), Inches(1.80), Inches(1.90)]

    table_fields = [
        ("ADJUDICATARIO / COMPRADOR:", client_name, "DNI / IDENTIFICACIÓN CA:", client_id),
        ("CIUDAD / DESTINO DE ENTREGA:", client_loc, "TELÉFONO DE CONTACTO:", client_phone),
        ("VEHÍCULO ADJUDICADO:", vehicle_desc, "LOTE COPART OFICIAL:", f"#{lot_number}"),
        ("NÚMERO DE SERIE / VIN:", vin, "TIPO DE TÍTULO OFICIAL:", title_type),
        ("PATIO FÍSICO DE ORIGEN:", "Copart Van Nuys (Yard #106)", "PROCEDENCIA DEL LOTE:", "Toyota Financial Services (Agencia)")
    ]

    for r_idx, row_d in enumerate(table_fields):
        row = it.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            c.width = it_col_widths[c_idx]
            set_cell_margins(c, 24, 24, 40, 40)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            val = row_d[c_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            if c_idx in (0, 2):
                set_cell_background(c, "F1F5F9")
                r.font.size = Pt(7.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(7.8)
                r.font.color.rgb = RGBColor(15, 23, 42)

    # 3. Financial Itemized Breakdown Table (3 cols: 3.40 in + 2.20 in + 1.80 in = 7.40 in)
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)
    p_sp.paragraph_format.space_after = Pt(2)

    ft = doc.add_table(rows=7, cols=3)
    ft.alignment = WD_TABLE_ALIGNMENT.CENTER
    ft.autofit = False
    ft_col_widths = [Inches(3.40), Inches(2.20), Inches(1.80)]

    buyer_fee = 585.0
    gate_fee = 79.0
    internet_fee = 89.0
    doc_fee = 97.0
    subtotal_fees = buyer_fee + gate_fee + internet_fee + doc_fee # 850.0
    copart_total = hammer_price + subtotal_fees # 6150 + 850 = 7000.0

    fees_data = [
        ("DESCRIPCIÓN DEL CONCEPTO", "DETALLE / NORMATIVA COPART", "IMPORTE (USD)"),
        ("VALOR MARTILLADO EN VIVO (HAMMER PRICE)", "Adjudicado en tiempo real bajo Paleta Oficial #101", f"${hammer_price:,.2f} USD"),
        ("TARIFA INSTITUCIONAL DE COMPRADOR (BUYER FEE)", "Arancel preferencial de comprador Copart Member", f"${buyer_fee:,.2f} USD"),
        ("CARGO POR PUJA VIRTUAL (INTERNET BID FEE)", "Conexión autorizada terminal en vivo Copart VB3", f"${internet_fee:,.2f} USD"),
        ("CARGO DE RETIRO EN PATIO (GATE & LOADING FEE)", "Maniobra de carga, precinto y despacho patio Van Nuys #106", f"${gate_fee:,.2f} USD"),
        ("DOCUMENTACIÓN, TÍTULO CALIFORNIA Y PLACA PROVISIONAL", "Título Limpio endosado + Placa temporal de circulación (30 días)", f"${doc_fee:,.2f} USD"),
        ("SUBTOTAL DE GASTOS Y ARANCELES OFICIALES", "Total aranceles reglamentarios y gastos de patio Copart", f"${subtotal_fees:,.2f} USD")
    ]

    for f_idx, (col0, col1, col2) in enumerate(fees_data):
        row = ft.rows[f_idx]
        for c_idx, text in enumerate([col0, col1, col2]):
            c = row.cells[c_idx]
            c.width = ft_col_widths[c_idx]
            set_cell_margins(c, 24, 24, 40, 40)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(text)
            r.font.name = "Arial"

            if f_idx == 0:
                set_cell_background(c, "0B2E59")
                r.font.size = Pt(8.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                if c_idx == 2:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                set_cell_background(c, "F8FAFC" if f_idx % 2 == 1 else "FFFFFF")
                r.font.size = Pt(8.0)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 1:
                    r.font.color.rgb = RGBColor(71, 85, 105)
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(11, 46, 89)

    # Total Balance Box (Proven clean layout)
    p_tot = doc.add_paragraph()
    p_tot.paragraph_format.space_before = Pt(4)
    p_tot.paragraph_format.space_after = Pt(3)
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_hinfo = p_tot.add_run(f"PRECIO MARTILLO: ${hammer_price:,.2f} USD  +  ARANCELES: ${subtotal_fees:,.2f} USD   |   ")
    r_hinfo.font.name = "Arial"
    r_hinfo.font.size = Pt(8.0)
    r_hinfo.font.bold = True
    r_hinfo.font.color.rgb = RGBColor(71, 85, 105)

    r_tlabel = p_tot.add_run("TOTAL A LIQUIDAR DIRECTO EN COPART: ")
    r_tlabel.font.name = "Arial"
    r_tlabel.font.size = Pt(9.5)
    r_tlabel.font.bold = True
    r_tlabel.font.color.rgb = RGBColor(15, 23, 42)

    r_tval = p_tot.add_run(f" ${copart_total:,.2f} USD")
    r_tval.font.name = "Arial Black"
    r_tval.font.size = Pt(12.5)
    r_tval.font.bold = True
    r_tval.font.color.rgb = RGBColor(16, 122, 60)

    # 4. Payment Instructions & Seal Table (2 cols: 4.30 in + 3.10 in = 7.40 in)
    pay_table = doc.add_table(rows=1, cols=2)
    pay_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pay_table.autofit = False

    pc1, pc2 = pay_table.rows[0].cells[0], pay_table.rows[0].cells[1]
    pc1.width, pc2.width = Inches(4.30), Inches(3.10)
    set_cell_background(pc1, "F1F5F9")
    set_cell_background(pc2, "F8FAFC")
    set_cell_margins(pc1, 26, 26, 40, 40)
    set_cell_margins(pc2, 26, 26, 40, 40)

    p_inst = pc1.paragraphs[0]
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(0)
    p_inst.paragraph_format.line_spacing = 1.10
    r_pi = p_inst.add_run(
        "INSTRUCCIONES OFICIALES DE LIQUIDACIÓN COPART:\n"
        "1. Beneficiario Oficial: COPART, INC. / MEMBER SETTLEMENT SERVICES\n"
        f"2. Referencia Obligatoria: LOTE #{lot_number} - JOHAN VLADIMIR RAJO ARIAS (DL: {client_id})\n"
        "3. Modalidad: Transferencia bancaria oficial (Wire Transfer) o depósito bancario autorizado.\n"
        f"4. Retiro y Logística: Salida autorizada desde Patio Van Nuys Yard #106 con traslado directo a su domicilio en {client_loc}.\n"
        "5. Al acreditarse la liquidación se emite de inmediato el Gate Pass Oficial, Título Limpio de California endosado a nombre del comprador y Placa Provisional válida por 30 días para rodar legalmente."
    )
    r_pi.font.name = "Arial"
    r_pi.font.size = Pt(7.0)
    r_pi.font.color.rgb = RGBColor(30, 41, 59)

    # Official Clearance & Seal
    p_seal = pc2.paragraphs[0]
    p_seal.paragraph_format.space_before = Pt(0)
    p_seal.paragraph_format.space_after = Pt(0)
    p_seal.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_sl = p_seal.add_run("CERTIFICACIÓN OFICIAL COPART MEMBER SERVICES:\n")
    r_sl.font.name = "Arial"
    r_sl.font.size = Pt(7.0)
    r_sl.font.bold = True
    r_sl.font.color.rgb = RGBColor(11, 46, 89)

    if os.path.exists(SEAL_IMAGE_PATH):
        r_simg = p_seal.add_run()
        r_simg.add_picture(SEAL_IMAGE_PATH, width=Inches(2.95))

    p_sm = pc2.add_paragraph()
    p_sm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sm.paragraph_format.space_before = Pt(1)
    p_sm.paragraph_format.space_after = Pt(0)
    r_smt = p_sm.add_run("Copart Member Settlement & Title Division\nVan Nuys Yard #106 • Title & Gate Clearance Official")
    r_smt.font.name = "Arial"
    r_smt.font.size = Pt(6.5)
    r_smt.font.bold = True
    r_smt.font.color.rgb = RGBColor(11, 46, 89)

    # Footer verification hash
    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_before = Pt(3)
    p_sec.paragraph_format.space_after = Pt(0)
    p_sec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sec = p_sec.add_run(f"ATOMIC SETTLEMENT HASH: CP-CA-{lot_number}-VANNUYS106-VB3-SOLD-6150 • COPART MEMBER SETTLEMENT PORTAL")
    r_sec.font.name = "Courier New"
    r_sec.font.size = Pt(6.0)
    r_sec.font.bold = True
    r_sec.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(output_docx_path)
    print(f"Created DOCX: {output_docx_path}")

    output_pdf_path = output_docx_path.replace(".docx", ".pdf")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    d = word.Documents.Open(os.path.abspath(output_docx_path))
    d.SaveAs(os.path.abspath(output_pdf_path), FileFormat=17)
    d.Close()
    word.Quit()

    pub_pdf = os.path.join(r"d:\SUBASTAS\public", os.path.basename(output_pdf_path))
    shutil.copy2(output_pdf_path, pub_pdf)

    brain_dir = r"C:\Users\ALP\.gemini\antigravity\brain\0d1ff2e6-2163-4b55-a715-f7244a37bb54"
    if os.path.exists(brain_dir):
        shutil.copy2(output_pdf_path, os.path.join(brain_dir, os.path.basename(output_pdf_path)))

    doc_fitz = fitz.open(output_pdf_path)
    page_count = len(doc_fitz)
    print(f"Generated PDF: {output_pdf_path} (Pages: {page_count})")

    # Render high-res PNG preview of page 1
    page = doc_fitz[0]
    pix = page.get_pixmap(dpi=150)
    preview_path = r"d:\SUBASTAS\public\factura_johan_preview.png"
    pix.save(preview_path)
    if os.path.exists(brain_dir):
        shutil.copy2(preview_path, os.path.join(brain_dir, "factura_johan_preview.png"))
    print(f"Rendered PNG preview: {preview_path}")

if __name__ == '__main__':
    generate_invoice()
