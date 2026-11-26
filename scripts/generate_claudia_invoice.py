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

def generate_invoice(
    invoice_no="INV-2026-VA-67797166",
    date_str="24 de Noviembre de 2026",
    client_name="Claudia Elena Villalobos",
    client_id="Claudia@cnfei.com",
    client_loc="Newport News, Virginia (VA)",
    client_email="Claudia@cnfei.com",
    lot_number="67797166",
    vin="2T1BURHE5FC482910",
    vehicle_desc="2015 TOYOTA COROLLA LE SEDÁN (138,551 mi)",
    title_type="TX - CLEAN TITLE + Placa Provisional (30 Días)",
    hammer_price=1150.0,
    output_docx_path=r"d:\SUBASTAS\FACTURA_COPART_CLAUDIA_ELENA_VILLALOBOS_COROLLA_2015.docx"
):
    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.40)
    sec.bottom_margin = Inches(0.40)
    sec.left_margin = Inches(0.50)
    sec.right_margin = Inches(0.50)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # Header Table
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    ht.autofit = False
    c1, c2 = ht.rows[0].cells[0], ht.rows[0].cells[1]
    c1.width, c2.width = Inches(3.3), Inches(4.2)
    
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
        "COPART MEMBER SERVICES & TITLE SETTLEMENT\n"
        "PATIO DE ORIGEN: Copart Houston South (Yard #10)\n"
        "DIRECCIÓN PATIO: 16600 E Freeway, Houston, TX 77049\n"
        "SOPORTE DE LIQUIDACIÓN: copartadjudications@gmail.com"
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
        f"FACTURA OFICIAL DE ADJUDICACIÓN / BILL OF SALE\n"
        f"FACTURA N°: {invoice_no} | FECHA: {date_str}\n"
        f"POSTOR TITULAR / PADDLE: PALETA #101\n"
        f"ESTADO DE SUBASTA: ADJUDICADO / SOLD (LOTE GANADO)"
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
    rt = pt.add_run("CERTIFICADO OFICIAL DE ADJUDICACIÓN Y LIQUIDACIÓN DE SUBASTA")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(11.5)
    rt.font.color.rgb = RGBColor(11, 46, 89)
    
    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(5)
    rts = ps.add_run("ORDEN DE COMPRA LEGAL Y AUTORIZACIÓN DE RETIRO DE PATIO (GATE PASS)")
    rts.font.name = "Arial"
    rts.font.size = Pt(9.0)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(16, 122, 60)
    
    # Buyer & Vehicle Information Table
    it = doc.add_table(rows=5, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
    it.autofit = False
    
    table_fields = [
        ("ADJUDICATARIA / COMPRADORA:", client_name, "DNI / IDENTIFICACIÓN:", client_id),
        ("CIUDAD / DESTINO DE ENTREGA:", client_loc, "CORREO REGISTRADO:", client_email),
        ("VEHÍCULO ADJUDICADO:", vehicle_desc, "LOTE COPART OFICIAL:", f"#{lot_number}"),
        ("NÚMERO DE SERIE / VIN:", vin, "TIPO DE TÍTULO OFICIAL:", title_type),
        ("PATIO FÍSICO DE ORIGEN:", "Copart Houston South (Yard #10)", "DIRECCIÓN DE ORIGEN:", "16600 E Freeway, Houston, TX")
    ]
    
    for r_idx, row_d in enumerate(table_fields):
        row = it.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            set_cell_margins(c, 28, 28, 50, 50)
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
                
    # Financial Itemized Breakdown Table
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)
    p_sp.paragraph_format.space_after = Pt(2)
    
    ft = doc.add_table(rows=6, cols=3)
    ft.alignment = WD_TABLE_ALIGNMENT.CENTER
    ft.autofit = False
    
    # AJUSTE EXACTO A $1,450 USD TOTAL (300 USD de gastos y aranceles)
    buyer_fee = 125.0
    gate_fee = 55.0
    internet_fee = 45.0
    doc_fee = 75.0
    copart_total = hammer_price + buyer_fee + gate_fee + internet_fee + doc_fee # 1150 + 125 + 55 + 45 + 75 = 1450.0
    
    fees_data = [
        ("DESCRIPCIÓN DEL CONCEPTO", "DETALLE / NORMATIVA COPART", "IMPORTE (USD)"),
        (f"VALOR MARTILLADO EN VIVO (HAMMER PRICE)", "Adjudicado en tiempo real bajo Paleta Oficial #101", f"${hammer_price:,.2f} USD"),
        ("TARIFA INSTITUCIONAL DE COMPRADOR (BUYER FEE)", "Arancel preferencial de comprador Copart Member", f"${buyer_fee:,.2f} USD"),
        ("CARGO DE RETIRO EN PATIO (GATE & LOADING FEE)", "Maniobra de carga, precinto y despacho en patio Houston #10", f"${gate_fee:,.2f} USD"),
        ("CARGO POR PUJA VIRTUAL (INTERNET BID FEE)", "Conexión autorizada terminal en vivo Copart VB3", f"${internet_fee:,.2f} USD"),
        ("DOCUMENTACIÓN, TÍTULO TEXAS Y PLACA PROVISIONAL", "Título endosado + Placa temporal de circulación (30 días)", f"${doc_fee:,.2f} USD")
    ]
    
    for f_idx, (col0, col1, col2) in enumerate(fees_data):
        row = ft.rows[f_idx]
        for c_idx, text in enumerate([col0, col1, col2]):
            c = row.cells[c_idx]
            set_cell_margins(c, 30, 30, 50, 50)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            r = p.add_run(text)
            r.font.name = "Arial"
            
            if f_idx == 0:
                set_cell_background(c, "0B2E59")
                r.font.size = Pt(8.2)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                if c_idx == 2:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                set_cell_background(c, "F8FAFC" if f_idx % 2 == 1 else "FFFFFF")
                r.font.size = Pt(8.5)
                if c_idx == 0:
                    c.width = Inches(3.6)
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 1:
                    c.width = Inches(2.3)
                    r.font.color.rgb = RGBColor(71, 85, 105)
                else:
                    c.width = Inches(1.6)
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(11, 46, 89)
                    
    # Total Balance Box
    p_tot = doc.add_paragraph()
    p_tot.paragraph_format.space_before = Pt(5)
    p_tot.paragraph_format.space_after = Pt(4)
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    r_tlabel = p_tot.add_run("TOTAL A LIQUIDAR DIRECTO EN COPART: ")
    r_tlabel.font.name = "Arial"
    r_tlabel.font.size = Pt(10.0)
    r_tlabel.font.bold = True
    r_tlabel.font.color.rgb = RGBColor(15, 23, 42)
    
    r_tval = p_tot.add_run(f" ${copart_total:,.2f} USD")
    r_tval.font.name = "Arial Black"
    r_tval.font.size = Pt(13)
    r_tval.font.bold = True
    r_tval.font.color.rgb = RGBColor(16, 122, 60)
    
    # Payment Instructions & Seal Table
    pay_table = doc.add_table(rows=1, cols=2)
    pay_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    pay_table.autofit = False
    
    pc1, pc2 = pay_table.rows[0].cells[0], pay_table.rows[0].cells[1]
    pc1.width, pc2.width = Inches(4.3), Inches(3.2)
    set_cell_background(pc1, "F1F5F9")
    set_cell_background(pc2, "F8FAFC")
    set_cell_margins(pc1, 35, 35, 50, 50)
    set_cell_margins(pc2, 35, 35, 50, 50)
    
    p_inst = pc1.paragraphs[0]
    p_inst.paragraph_format.space_before = Pt(0)
    p_inst.paragraph_format.space_after = Pt(0)
    p_inst.paragraph_format.line_spacing = 1.15
    r_pi = p_inst.add_run(
        "INSTRUCCIONES OFICIALES DE LIQUIDACIÓN COPART:\n"
        "1. Beneficiario Oficial: COPART, INC. / MEMBER SETTLEMENT SERVICES\n"
        f"2. Referencia Obligatoria: LOTE #{lot_number} - CLAUDIA VILLALOBOS (ID: {client_id})\n"
        "3. Modalidad: Transferencia bancaria oficial (Wire Transfer) o depósito bancario autorizado.\n"
        f"4. Retiro y Logística: Salida autorizada desde Patio Houston South Yard #10 con destino a {client_loc}.\n"
        "5. Al acreditarse la liquidación se emite de inmediato el Gate Pass Oficial, Título Limpio endosado y Placa Provisional válida por 30 días para rodar legalmente."
    )
    r_pi.font.name = "Arial"
    r_pi.font.size = Pt(7.5)
    r_pi.font.color.rgb = RGBColor(30, 41, 59)
    
    # Official Clearance & Seal
    p_seal = pc2.paragraphs[0]
    p_seal.paragraph_format.space_before = Pt(0)
    p_seal.paragraph_format.space_after = Pt(0)
    p_seal.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_sl = p_seal.add_run("CERTIFICACIÓN OFICIAL COPART MEMBER SERVICES:\n")
    r_sl.font.name = "Arial"
    r_sl.font.size = Pt(7.5)
    r_sl.font.bold = True
    r_sl.font.color.rgb = RGBColor(11, 46, 89)
    
    if os.path.exists(SEAL_IMAGE_PATH):
        r_simg = p_seal.add_run()
        r_simg.add_picture(SEAL_IMAGE_PATH, width=Inches(3.2))
        
    p_sm = pc2.add_paragraph()
    p_sm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sm.paragraph_format.space_before = Pt(2)
    p_sm.paragraph_format.space_after = Pt(0)
    r_smt = p_sm.add_run("Copart Member Settlement & Title Division\nHouston South Yard #10 • Title & Gate Clearance")
    r_smt.font.name = "Arial"
    r_smt.font.size = Pt(7.0)
    r_smt.font.bold = True
    r_smt.font.color.rgb = RGBColor(11, 46, 89)
    
    # Footer verification hash
    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_before = Pt(4)
    p_sec.paragraph_format.space_after = Pt(0)
    p_sec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sec = p_sec.add_run(f"ATOMIC SETTLEMENT HASH: CP-VA-{lot_number}-HOUSTON-VB3 • COPART MEMBER SETTLEMENT PORTAL")
    r_sec.font.name = "Courier New"
    r_sec.font.size = Pt(6.5)
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
    shutil.copy2(output_pdf_path, os.path.join(r"d:\app usa", os.path.basename(output_pdf_path)))
    
    doc_fitz = fitz.open(output_pdf_path)
    print(f"Generated PDF: {output_pdf_path} (Pages: {len(doc_fitz)})")
    return output_pdf_path


def generate_wire_slip(
    folio="WIRE-VA-67797166-SETTLE",
    date_str="24 de Noviembre de 2026",
    client_name="Claudia Elena Villalobos",
    client_id="Claudia@cnfei.com",
    lot_number="67797166",
    vin="2T1BURHE5FC482910",
    client_dest="Newport News, Virginia (VA)",
    copart_total=1450.0,
    output_docx_path=r"d:\SUBASTAS\FICHA_PAGO_WIRE_COPART_CLAUDIA_ELENA_VILLALOBOS.docx"
):
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
        f"FOLIO DE PAGO: {folio}\n"
        f"FECHA DE EMISIÓN: {date_str}\n"
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
        ("ADJUDICATARIA / MIEMBRO:", client_name, "ID / IDENTIFICACIÓN:", client_id),
        ("VEHÍCULO ADJUDICADO:", "2015 Toyota Corolla LE (Sedán)", "LOTE COPART OFICIAL:", f"#{lot_number}"),
        ("NÚMERO DE VIN / SERIE:", vin, "CIUDAD DE DESTINO:", client_dest)
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
            r1.font.color.rgb = RGBColor(255, 255, 255)
        else:
            set_cell_background(c0, "F1F5F9")
            set_cell_background(c1, "FFFFFF")
            r0.font.size = Pt(8.5)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(30, 41, 59)
            r1.font.size = Pt(9.0)
            r1.font.bold = True if r_idx in (1, 3, 4, 5) else False
            r1.font.color.rgb = RGBColor(16, 122, 60) if r_idx in (3, 4) else RGBColor(15, 23, 42)

    # Exact Total to Transfer Box
    p_tot = doc.add_paragraph()
    p_tot.paragraph_format.space_before = Pt(6)
    p_tot.paragraph_format.space_after = Pt(4)
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    r_tl = p_tot.add_run("MONTO EXACTO A LIQUIDAR (WIRE AMOUNT): ")
    r_tl.font.name = "Arial"
    r_tl.font.size = Pt(10.0)
    r_tl.font.bold = True
    r_tl.font.color.rgb = RGBColor(15, 23, 42)

    r_tv = p_tot.add_run(f"${copart_total:,.2f} USD")
    r_tv.font.name = "Arial Black"
    r_tv.font.size = Pt(14)
    r_tv.font.bold = True
    r_tv.font.color.rgb = RGBColor(16, 122, 60)

    # Critical Reference & Instructions Box
    crit_table = doc.add_table(rows=1, cols=2)
    crit_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    crit_table.autofit = False

    cc1, cc2 = crit_table.rows[0].cells[0], crit_table.rows[0].cells[1]
    cc1.width, cc2.width = Inches(4.3), Inches(3.2)
    set_cell_background(cc1, "FEF3C7")
    set_cell_background(cc2, "F8FAFC")
    set_cell_margins(cc1, 35, 35, 50, 50)
    set_cell_margins(cc2, 35, 35, 50, 50)

    p_cr = cc1.paragraphs[0]
    p_cr.paragraph_format.space_before = Pt(0)
    p_cr.paragraph_format.space_after = Pt(0)
    p_cr.paragraph_format.line_spacing = 1.15
    r_cri = p_cr.add_run(
        "⚠️ CONCEPTO OBLIGATORIO DE TRANSFERENCIA:\n"
        f"Por favor indique en el concepto o nota de su Wire:\n"
        f"» LOTE #{lot_number} - CLAUDIA VILLALOBOS «\n\n"
        "NOTAS OPERATIVAS:\n"
        "• El comprobante debe enviarse vía correo o WhatsApp para conciliación inmediata.\n"
        "• Una vez acreditado, el sistema emite el Gate Pass con PIN de salida y se asigna la grúa para retiro en Houston South Yard #10.\n"
        "• Incluye placa provisional de 30 días para circular inmediatamente."
    )
    r_cri.font.name = "Arial"
    r_cri.font.size = Pt(7.5)
    r_cri.font.color.rgb = RGBColor(146, 64, 14)

    # Seal & Signature in cc2
    p_seal = cc2.paragraphs[0]
    p_seal.paragraph_format.space_before = Pt(0)
    p_seal.paragraph_format.space_after = Pt(0)
    p_seal.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r_sl = p_seal.add_run("DEPARTAMENTO DE CARTERA & TESORERÍA:\n")
    r_sl.font.name = "Arial"
    r_sl.font.size = Pt(7.5)
    r_sl.font.bold = True
    r_sl.font.color.rgb = RGBColor(11, 46, 89)

    if os.path.exists(SEAL_IMAGE_PATH):
        r_simg = p_seal.add_run()
        r_simg.add_picture(SEAL_IMAGE_PATH, width=Inches(3.2))

    p_sm = cc2.add_paragraph()
    p_sm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sm.paragraph_format.space_before = Pt(2)
    p_sm.paragraph_format.space_after = Pt(0)
    r_smt = p_sm.add_run("Copart Treasury Division • Wire Verification\nHouston South Yard #10 • Authorized Settlement")
    r_smt.font.name = "Arial"
    r_smt.font.size = Pt(7.0)
    r_smt.font.bold = True
    r_smt.font.color.rgb = RGBColor(11, 46, 89)

    # Footer verification hash
    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_before = Pt(4)
    p_sec.paragraph_format.space_after = Pt(0)
    p_sec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sec = p_sec.add_run(f"WIRE SETTLEMENT TOKEN: W-CP-{lot_number}-VA-ACCREDITED • COPART TREASURY GATEWAY")
    r_sec.font.name = "Courier New"
    r_sec.font.size = Pt(6.5)
    r_sec.font.bold = True
    r_sec.font.color.rgb = RGBColor(100, 116, 139)

    doc.save(output_docx_path)
    print(f"Created Wire Slip DOCX: {output_docx_path}")

    output_pdf_path = output_docx_path.replace(".docx", ".pdf")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    d = word.Documents.Open(os.path.abspath(output_docx_path))
    d.SaveAs(os.path.abspath(output_pdf_path), FileFormat=17)
    d.Close()
    word.Quit()

    pub_pdf = os.path.join(r"d:\SUBASTAS\public", os.path.basename(output_pdf_path))
    shutil.copy2(output_pdf_path, pub_pdf)
    shutil.copy2(output_pdf_path, os.path.join(r"d:\app usa", os.path.basename(output_pdf_path)))

    doc_fitz = fitz.open(output_pdf_path)
    print(f"Generated Wire Slip PDF: {output_pdf_path} (Pages: {len(doc_fitz)})")
    return output_pdf_path

if __name__ == "__main__":
    generate_invoice()
    generate_wire_slip()
