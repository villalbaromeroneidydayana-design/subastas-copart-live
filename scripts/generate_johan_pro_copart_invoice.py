import docx, win32com.client, os, shutil, fitz
from PIL import Image, ImageDraw
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

SEAL_IMAGE_PATH = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"
LOGO_IMAGE_PATH = r"d:\SUBASTAS\public\copart_logo_header.png"
BARCODE_IMAGE_PATH = r"d:\SUBASTAS\public\barcode_76061096.png"

def create_barcode():
    im = Image.new('RGB', (340, 56), color='white')
    draw = ImageDraw.Draw(im)
    pattern = [
        2,1,1,2,3,1,1,1,2,2,1,3,1,1,2,1,3,2,1,1,1,2,3,1,2,1,1,1,3,2,1,2,2,1,1,3,1,1,
        2,3,2,1,1,1,2,1,3,1,1,2,2,3,1,1,2,1,1,3,2,2,1,1,2,1,3,1,2,2,1,1,3,2,1,1,2,3,
        1,1,2,2,1,1,3,2,1,2,1,1,3,2,2,1,1,2
    ]
    x = 15
    for w in pattern:
        draw.rectangle([x, 3, x+w, 38], fill='black')
        x += w + 2
    draw.text((85, 42), '* LOT 76061096 - YARD 106 *', fill='black')
    im.save(BARCODE_IMAGE_PATH)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=26, bottom=26, left=45, right=45):
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

def generate_pro_invoice():
    create_barcode()
    invoice_no = "106-76061096-CA"
    date_str = "25 de Noviembre de 2026"
    client_name = "JOHAN VLADIMIR RAJO ARIAS"
    client_id = "California DL W1947766 (DOB: 06/12/1978)"
    client_loc = "1800 W. Gramercy Ave Apt 54, Anaheim, CA 92801"
    client_phone = "+1 (714) 272-1351"
    client_email = "Johanvladimirrajoarias@gmail.com"
    lot_number = "76061096"
    vin = "4T1T11AK8NU519082"
    vehicle_desc = "2022 TOYOTA CAMRY SE SPORT EDITION"
    title_type = "CA - CERTIFICATE OF TITLE (CLEAN TITLE) + Placa Provisional (30 Días)"
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

    # 1. HEADER TABLE (3 Columns, Exact widths = 2.50 + 2.30 + 2.60 = 7.40 in)
    ht = doc.add_table(rows=1, cols=3)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    ht.autofit = False
    ht_widths = [Inches(2.50), Inches(2.30), Inches(2.60)]
    for c_idx, w in enumerate(ht_widths):
        ht.rows[0].cells[c_idx].width = w

    c1, c2, c3 = ht.rows[0].cells[0], ht.rows[0].cells[1], ht.rows[0].cells[2]

    # Left: Copart Logo & Facility Info
    p_logo = c1.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_l = p_logo.add_run()
        r_l.add_picture(LOGO_IMAGE_PATH, width=Inches(1.80))

    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(0)
    p_sub.paragraph_format.line_spacing = 1.05
    r_s = p_sub.add_run(
        "COPART AUTO AUCTIONS • FACILITY #106\n"
        "16161 Raymer St, Van Nuys, CA 91406\n"
        "Tel: (818) 782-9600 | dispatch.ca@copart.com\n"
        "Division: Member Settlement & Title Clearance"
    )
    r_s.font.name = "Arial"
    r_s.font.size = Pt(6.8)
    r_s.font.bold = True
    r_s.font.color.rgb = RGBColor(71, 85, 105)

    # Center: Crisp Barcode & Lot Number
    p_bar = c2.paragraphs[0]
    p_bar.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bar.paragraph_format.space_before = Pt(0)
    p_bar.paragraph_format.space_after = Pt(0)
    if os.path.exists(BARCODE_IMAGE_PATH):
        r_b = p_bar.add_run()
        r_b.add_picture(BARCODE_IMAGE_PATH, width=Inches(2.1))
    p_btxt = c2.add_paragraph()
    p_btxt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_btxt.paragraph_format.space_before = Pt(1)
    p_btxt.paragraph_format.space_after = Pt(0)
    r_bt = p_btxt.add_run(f"LOTE OFICIAL: #{lot_number}\nCALIFORNIA CLEAN TITLE")
    r_bt.font.name = "Arial Black"
    r_bt.font.size = Pt(7.5)
    r_bt.font.color.rgb = RGBColor(11, 46, 89)

    # Right: Invoice Box
    p_meta = c3.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    p_meta.paragraph_format.line_spacing = 1.10
    r_m = p_meta.add_run(
        f"MEMBER SALES RECEIPT & BILL OF SALE\n"
        f"FACTURA N°: {invoice_no}\n"
        f"FECHA DE VENTA: {date_str}\n"
        f"POSTOR / PADDLE: PALETA OFICIAL #101\n"
        f"ESTADO: ADJUDICADO / SOLD (LOTE GANADO)\n"
        f"TÉRMINOS: WIRE TRANSFER / LIQUIDACIÓN"
    )
    r_m.font.name = "Arial"
    r_m.font.size = Pt(7.0)
    r_m.font.bold = True
    r_m.font.color.rgb = RGBColor(11, 46, 89)

    # Divider bar
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(2)
    p_div.paragraph_format.space_after = Pt(2)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 74)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(8.5)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6)

    # Title Banner
    pt = doc.add_paragraph()
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(1)
    rt = pt.add_run("CERTIFICADO OFICIAL DE ADJUDICACIÓN Y ORDEN DE COMPRA LEGAL (BILL OF SALE)")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(10.0)
    rt.font.color.rgb = RGBColor(11, 46, 89)

    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(3)
    rts = ps.add_run("AUTORIZACIÓN DE DESPACHO EN PATIO Y TRASLADO DIRECTO (GATE PASS)")
    rts.font.name = "Arial"
    rts.font.size = Pt(7.8)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(16, 122, 60)

    # 2. MEMBER & DISPATCH INFORMATION TABLE
    it = doc.add_table(rows=5, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
    it.autofit = False
    it_col_widths = [Inches(1.80), Inches(1.90), Inches(1.80), Inches(1.90)]

    table_fields = [
        ("ADJUDICATARIO / COMPRADOR:", client_name, "DNI / LICENCIA CA:", client_id),
        ("DOMICILIO DE ENTREGA:", client_loc, "TELÉFONO DE CONTACTO:", client_phone),
        ("BROKER AUTORIZADO MANDANTE:", "PUJAMOTOR AUTOS USA (Broker Lic)", "PADDLE ASIGNADO:", "PALETA #101 (Conexión VB3)"),
        ("DESTINO FINAL DE TRASLADO:", "Anaheim, CA (Flete Puerta a Puerta)", "ORIGEN DEL LOTE:", "Toyota Financial Services"),
        ("PATIO COPART DE SALIDA:", "Copart Van Nuys #106 (Raymer St)", "TIPO DE RETIRO:", "Grúa Plataforma Certificada Directa")
    ]

    for r_idx, row_d in enumerate(table_fields):
        row = it.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            c.width = it_col_widths[c_idx]
            set_cell_margins(c, 18, 18, 35, 35)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            val = row_d[c_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            if c_idx in (0, 2):
                set_cell_background(c, "F1F5F9")
                r.font.size = Pt(7.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(7.2)
                r.font.color.rgb = RGBColor(15, 23, 42)

    # 3. VEHICLE SPECIFICATIONS GRID
    p_vsp = doc.add_paragraph()
    p_vsp.paragraph_format.space_before = Pt(3)
    p_vsp.paragraph_format.space_after = Pt(1)
    r_vth = p_vsp.add_run("ESPECIFICACIONES TÉCNICAS Y CONDICIÓN DEL VEHÍCULO REGISTRADAS EN PATIO:")
    r_vth.font.name = "Arial"
    r_vth.font.size = Pt(7.2)
    r_vth.font.bold = True
    r_vth.font.color.rgb = RGBColor(11, 46, 89)

    vt = doc.add_table(rows=4, cols=4)
    vt.alignment = WD_TABLE_ALIGNMENT.CENTER
    vt.autofit = False
    vt_col_widths = [Inches(1.80), Inches(1.90), Inches(1.80), Inches(1.90)]

    veh_fields = [
        ("VEHÍCULO / MODELO:", "2022 TOYOTA CAMRY SE (SPORT)", "LOTE COPART:", f"#{lot_number}"),
        ("N° DE SERIE (VIN):", vin, "ODÓMETRO VERIFICADO:", "99,960 mi (ACTUAL RECERTIFICADO)"),
        ("TÍTULO VEHICULAR:", "CALIFORNIA CLEAN TITLE (Limpio)", "ESTADO OPERATIVO:", "RUN & DRIVE CERTIFIED (GREEN LIGHT)"),
        ("MOTOR Y TRANSMISIÓN:", "2.5L 4-Cyl DOHC / Auto 8-Vel Sport", "LLAVES ORIGINALES:", "PRESENTES (ORIGINAL MASTER KEY)")
    ]

    for r_idx, row_d in enumerate(veh_fields):
        row = vt.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            c.width = vt_col_widths[c_idx]
            set_cell_margins(c, 18, 18, 35, 35)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            val = row_d[c_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            if c_idx in (0, 2):
                set_cell_background(c, "EFF6FF")
                r.font.size = Pt(7.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 58, 138)
            else:
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(7.2)
                r.font.color.rgb = RGBColor(15, 23, 42)

    # 4. FINANCIAL ITEMIZED LEDGER (3 COLUMNS WITH MASSIVE ROOM FOR IMPORTE: 3.40 + 2.20 + 1.80 = 7.40 INCHES)
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(3)
    p_sp.paragraph_format.space_after = Pt(1)

    ft = doc.add_table(rows=7, cols=3)
    ft.alignment = WD_TABLE_ALIGNMENT.CENTER
    ft.autofit = False
    ft_col_widths = [Inches(3.40), Inches(2.20), Inches(1.80)]

    buyer_fee = 585.0
    internet_fee = 89.0
    gate_fee = 79.0
    doc_fee = 97.0
    subtotal_fees = buyer_fee + internet_fee + gate_fee + doc_fee # 850.0
    copart_total = hammer_price + subtotal_fees # 7000.0

    fees_data = [
        ("DESCRIPCIÓN DEL CONCEPTO (ITEM / CODE)", "DETALLE TÉCNICO Y NORMATIVA COPART", "IMPORTE (USD)"),
        ("[LOT SALE] VALOR MARTILLADO EN VIVO (HAMMER PRICE)", "Adjudicado en tiempo real bajo Paleta Oficial #101", f"${hammer_price:,.2f} USD"),
        ("[BUYF] TARIFA DE COMPRADOR COPART (BUYER FEE)", "Arancel reglamentario según escala de subasta Copart", f"${buyer_fee:,.2f} USD"),
        ("[VIBF] CARGO POR PUJA VIRTUAL EN VIVO (VB3 FEE)", "Conexión autorizada terminal en vivo Copart VB3", f"${internet_fee:,.2f} USD"),
        ("[GATE] CARGO DE RETIRO EN PATIO (GATE & LOADING)", "Maniobra de carga, precinto y salida en patio Van Nuys #106", f"${gate_fee:,.2f} USD"),
        ("[DOCF] GESTIÓN DMV CA, TÍTULO Y PLACA TEMPORAL", "Título Limpio California endosado + Placa temporal 30 días", f"${doc_fee:,.2f} USD"),
        ("[SUBT] SUBTOTAL CARGOS Y ARANCELES OFICIALES", "Total cargos operativos y aranceles Copart Member Services", f"${subtotal_fees:,.2f} USD")
    ]

    for f_idx, (col0, col1, col2) in enumerate(fees_data):
        row = ft.rows[f_idx]
        for c_idx, text in enumerate([col0, col1, col2]):
            c = row.cells[c_idx]
            c.width = ft_col_widths[c_idx]
            set_cell_margins(c, 20, 20, 35, 35)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(text)
            r.font.name = "Arial"

            if f_idx == 0:
                set_cell_background(c, "0B2E59")
                r.font.size = Pt(7.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                if c_idx == 2:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                set_cell_background(c, "F8FAFC" if f_idx % 2 == 1 else "FFFFFF")
                r.font.size = Pt(7.5)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 1:
                    r.font.color.rgb = RGBColor(71, 85, 105)
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(11, 46, 89)

    # 5. TOTAL BALANCE SUMMARY BOX (Proven, clean, right-aligned)
    p_tot_info = doc.add_paragraph()
    p_tot_info.paragraph_format.space_before = Pt(3)
    p_tot_info.paragraph_format.space_after = Pt(1)
    p_tot_info.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_ti = p_tot_info.add_run(f"VALOR MARTILLO (HAMMER): ${hammer_price:,.2f} USD   |   ARANCELES COPART: ${subtotal_fees:,.2f} USD")
    r_ti.font.name = "Arial"
    r_ti.font.size = Pt(8.0)
    r_ti.font.bold = True
    r_ti.font.color.rgb = RGBColor(71, 85, 105)

    p_tot = doc.add_paragraph()
    p_tot.paragraph_format.space_before = Pt(0)
    p_tot.paragraph_format.space_after = Pt(3)
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_tlabel = p_tot.add_run("TOTAL LIQUIDACIÓN DIRECTA COPART: ")
    r_tlabel.font.name = "Arial"
    r_tlabel.font.size = Pt(9.5)
    r_tlabel.font.bold = True
    r_tlabel.font.color.rgb = RGBColor(15, 23, 42)

    r_tval = p_tot.add_run(f" ${copart_total:,.2f} USD")
    r_tval.font.name = "Arial Black"
    r_tval.font.size = Pt(12.5)
    r_tval.font.bold = True
    r_tval.font.color.rgb = RGBColor(16, 122, 60)

    # 6. PAYMENT SETTLEMENT INSTRUCTIONS & CERTIFICATION SEAL
    pay_table = doc.add_table(rows=1, cols=2)
    pay_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pay_table.autofit = False

    pc1, pc2 = pay_table.rows[0].cells[0], pay_table.rows[0].cells[1]
    pc1.width, pc2.width = Inches(4.30), Inches(3.10)
    set_cell_background(pc1, "F1F5F9")
    set_cell_background(pc2, "F8FAFC")
    set_cell_margins(pc1, 20, 20, 35, 35)
    set_cell_margins(pc2, 20, 20, 35, 35)

    p_inst = pc1.paragraphs[0]
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(0)
    p_inst.paragraph_format.line_spacing = 1.05
    r_pi = p_inst.add_run(
        "INSTRUCCIONES OFICIALES DE LIQUIDACIÓN Y DESPACHO COPART:\n"
        "1. BENEFICIARIO: COPART, INC. / MEMBER SETTLEMENT SERVICES\n"
        f"2. REFERENCIA OBLIGATORIA: LOTE #{lot_number} - JOHAN VLADIMIR RAJO ARIAS (DL: {client_id})\n"
        "3. MODALIDAD: Transferencia bancaria oficial (Wire Transfer) o depósito bancario autorizado.\n"
        f"4. LIBERACIÓN Y RETIRO: Salida autorizada bajo Gate Pass desde Patio Van Nuys #106 con traslado directo en grúa plataforma a su domicilio en {client_loc}.\n"
        "5. DOCUMENTACIÓN DE ENTREGA: Al acreditarse los fondos se entrega Título Limpio de California endosado a nombre del comprador y Placa Provisional de 30 días para circular legalmente."
    )
    r_pi.font.name = "Arial"
    r_pi.font.size = Pt(6.5)
    r_pi.font.color.rgb = RGBColor(30, 41, 59)

    # Seal & Officer Signature
    p_seal = pc2.paragraphs[0]
    p_seal.paragraph_format.space_before = Pt(0)
    p_seal.paragraph_format.space_after = Pt(0)
    p_seal.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_sl = p_seal.add_run("CERTIFICACIÓN OFICIAL COPART MEMBER SERVICES:\n")
    r_sl.font.name = "Arial"
    r_sl.font.size = Pt(6.5)
    r_sl.font.bold = True
    r_sl.font.color.rgb = RGBColor(11, 46, 89)

    if os.path.exists(SEAL_IMAGE_PATH):
        r_simg = p_seal.add_run()
        r_simg.add_picture(SEAL_IMAGE_PATH, width=Inches(2.85))

    p_sm = pc2.add_paragraph()
    p_sm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sm.paragraph_format.space_before = Pt(1)
    p_sm.paragraph_format.space_after = Pt(0)
    r_smt = p_sm.add_run("Copart Member Settlement & Title Clearance Division\nFacility #106 (Van Nuys, CA) • Gate Pass Official")
    r_smt.font.name = "Arial"
    r_smt.font.size = Pt(6.2)
    r_smt.font.bold = True
    r_smt.font.color.rgb = RGBColor(11, 46, 89)

    # 7. LEGAL NOTICE & SECURITY HASH FOOTER
    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_before = Pt(2)
    p_sec.paragraph_format.space_after = Pt(0)
    p_sec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sec = p_sec.add_run(
        f"ATOMIC SETTLEMENT HASH: CP-CA-{lot_number}-VANNUYS106-VB3-SOLD-6150 • COPART VERIFIED PORTAL\n"
        "COPART MEMBER SERVICES • VEHICLE AUCTIONEER & SETTLEMENT LICENSE #489210 • GREEN LIGHT CERTIFIED"
    )
    r_sec.font.name = "Courier New"
    r_sec.font.size = Pt(5.8)
    r_sec.font.bold = True
    r_sec.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(output_docx_path)
    print(f"Created DOCX: {output_docx_path}")

    output_pdf_path = output_docx_path.replace(".docx", ".pdf")

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        d = word.Documents.Open(os.path.abspath(output_docx_path))
        d.SaveAs(os.path.abspath(output_pdf_path), FileFormat=17)
        d.Close()
    finally:
        word.Quit()

    pub_pdf = os.path.join(r"d:\SUBASTAS\public", os.path.basename(output_pdf_path))
    shutil.copy2(output_pdf_path, pub_pdf)

    brain_dir = r"C:\Users\ALP\.gemini\antigravity\brain\0d1ff2e6-2163-4b55-a715-f7244a37bb54"
    if os.path.exists(brain_dir):
        shutil.copy2(output_pdf_path, os.path.join(brain_dir, os.path.basename(output_pdf_path)))

    doc_fitz = fitz.open(output_pdf_path)
    page_count = len(doc_fitz)
    print(f"Generated PDF: {output_pdf_path} (Pages: {page_count})")

    # Render high-res PNG preview
    page = doc_fitz[0]
    pix = page.get_pixmap(dpi=150)
    preview_path = r"d:\SUBASTAS\public\factura_johan_preview.png"
    pix.save(preview_path)
    if os.path.exists(brain_dir):
        shutil.copy2(preview_path, os.path.join(brain_dir, "factura_johan_preview.png"))
    print(f"Rendered PNG preview: {preview_path}")
    return page_count

if __name__ == '__main__':
    generate_pro_invoice()
