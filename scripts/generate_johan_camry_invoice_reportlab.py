import os, shutil, fitz
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable

def generate_invoice_pdf():
    pdf_out = r"d:\SUBASTAS\FACTURA_COPART_JOHAN_VLADIMIR_CAMRY_2022.pdf"
    pub_out = r"d:\SUBASTAS\public\FACTURA_COPART_JOHAN_VLADIMIR_CAMRY_2022.pdf"
    preview_out = r"d:\SUBASTAS\public\factura_johan_preview.png"
    brain_dir = r"C:\Users\ALP\.gemini\antigravity\brain\0d1ff2e6-2163-4b55-a715-f7244a37bb54"

    logo_path = r"d:\SUBASTAS\public\copart_logo_header.png"
    barcode_path = r"d:\SUBASTAS\public\barcode_76061096.png"
    seal_path = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"

    lot_number = "76061096"
    client_id = "DL W1947766 (California)"
    client_loc = "1800 W. Gramercy Ave Apt 54, Anaheim, CA 92801"

    # Exact 1-page Letter layout with 32pt margins (Printable width = 548pt)
    doc = SimpleDocTemplate(
        pdf_out,
        pagesize=letter,
        rightMargin=32,
        leftMargin=32,
        topMargin=26,
        bottomMargin=26
    )

    # Styles
    hdr_sub = ParagraphStyle('HdrSub', fontName='Helvetica-Bold', fontSize=6.8, leading=8.5, textColor=colors.HexColor('#475569'))
    hdr_meta = ParagraphStyle('HdrMeta', fontName='Helvetica-Bold', fontSize=7.0, leading=9.0, textColor=colors.HexColor('#0B2E59'), alignment=2)
    hdr_bar = ParagraphStyle('HdrBar', fontName='Helvetica-Bold', fontSize=7.2, leading=8.5, textColor=colors.HexColor('#0B2E59'), alignment=1)
    
    doc_title = ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=10.5, leading=12.5, textColor=colors.HexColor('#0B2E59'), alignment=1)
    doc_sub = ParagraphStyle('DocSub', fontName='Helvetica-Bold', fontSize=8.0, leading=10.0, textColor=colors.HexColor('#166534'), alignment=1)

    th_label = ParagraphStyle('ThLabel', fontName='Helvetica-Bold', fontSize=7.2, leading=9.0, textColor=colors.HexColor('#1E293B'))
    th_val = ParagraphStyle('ThVal', fontName='Helvetica', fontSize=7.2, leading=9.0, textColor=colors.HexColor('#0F172A'))

    tbl_hdr = ParagraphStyle('TblHdr', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.white)
    tbl_hdr_r = ParagraphStyle('TblHdrR', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.white, alignment=2)
    tbl_cell = ParagraphStyle('TblCell', fontName='Helvetica-Bold', fontSize=7.2, leading=9.0, textColor=colors.HexColor('#0F172A'))
    tbl_cell_sub = ParagraphStyle('TblCellSub', fontName='Helvetica', fontSize=7.0, leading=8.5, textColor=colors.HexColor('#475569'))
    tbl_cell_amt = ParagraphStyle('TblCellAmt', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0B2E59'), alignment=2)

    tot_left = ParagraphStyle('TotLeft', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#334155'))
    tot_right = ParagraphStyle('TotRight', fontName='Helvetica-Bold', fontSize=9.0, leading=11.0, textColor=colors.HexColor('#0F172A'), alignment=2)

    inst_body = ParagraphStyle('InstBody', fontName='Helvetica', fontSize=6.5, leading=8.0, textColor=colors.HexColor('#1E293B'))
    seal_txt = ParagraphStyle('SealTxt', fontName='Helvetica-Bold', fontSize=6.5, leading=8.0, textColor=colors.HexColor('#0B2E59'), alignment=1)
    footer_sec = ParagraphStyle('FooterSec', fontName='Courier-Bold', fontSize=5.8, leading=7.2, textColor=colors.HexColor('#64748B'), alignment=1)

    story = []

    # 1. HEADER (Logo left, Barcode center, Metadata right)
    # Col widths: 185pt, 168pt, 195pt = 548pt
    logo_img = Image(logo_path, width=135, height=45) if os.path.exists(logo_path) else Paragraph('<b>COPART</b>', doc_title)
    sub_para = Paragraph("<b>COPART AUTO AUCTIONS • FACILITY #106</b><br/>16161 Raymer St, Van Nuys, CA 91406<br/>Tel: (818) 782-9600 | dispatch.ca@copart.com<br/>Member Settlement & Title Clearance Division", hdr_sub)

    barcode_img = Image(barcode_path, width=155, height=28) if os.path.exists(barcode_path) else Paragraph('<b>* 76061096 *</b>', hdr_bar)
    bar_txt = Paragraph("<b>LOTE OFICIAL #76061096</b><br/>CALIFORNIA CLEAN TITLE", hdr_bar)

    meta_para = Paragraph("<b>MEMBER SALES RECEIPT & BILL OF SALE</b><br/>FACTURA N°: <b>106-76061096-CA</b><br/>FECHA DE VENTA: <b>25 de Noviembre de 2026</b><br/>POSTOR / PADDLE: <b>PALETA OFICIAL #101</b><br/>ESTADO: <b>ADJUDICADO / SOLD (LOTE GANADO)</b><br/>TÉRMINOS: <b>WIRE TRANSFER / LIQUIDACIÓN</b>", hdr_meta)

    header_table = Table([
        [
            [logo_img, Spacer(1, 2), sub_para],
            [barcode_img, Spacer(1, 2), bar_txt],
            meta_para
        ]
    ], colWidths=[185, 168, 195])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)

    # Gold divider bar
    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=3, spaceAfter=3))

    # Titles
    story.append(Paragraph("CERTIFICADO OFICIAL DE ADJUDICACIÓN Y ORDEN DE COMPRA LEGAL (BILL OF SALE)", doc_title))
    story.append(Paragraph("AUTORIZACIÓN DE DESPACHO EN PATIO Y TRASLADO DIRECTO (GATE PASS)", doc_sub))
    story.append(Spacer(1, 3))

    # 2. MEMBER & VEHICLE INFO TABLE (4 cols: 137pt, 137pt, 137pt, 137pt = 548pt)
    info_data = [
        [
            Paragraph("ADJUDICATARIO / COMPRADOR:", th_label),
            Paragraph("<b>JOHAN VLADIMIR RAJO ARIAS</b>", th_val),
            Paragraph("DNI / LICENCIA CA:", th_label),
            Paragraph("<b>DL W1947766</b> (DOB: 06/12/1978)", th_val)
        ],
        [
            Paragraph("DOMICILIO DE ENTREGA:", th_label),
            Paragraph("1800 W. Gramercy Ave Apt 54, Anaheim, CA", th_val),
            Paragraph("TELÉFONO DE CONTACTO:", th_label),
            Paragraph("+1 (714) 272-1351", th_val)
        ],
        [
            Paragraph("VEHÍCULO ADJUDICADO:", th_label),
            Paragraph("<b>2022 TOYOTA CAMRY SE (SPORT)</b>", th_val),
            Paragraph("LOTE COPART OFICIAL:", th_label),
            Paragraph("<b>#76061096</b>", th_val)
        ],
        [
            Paragraph("NÚMERO DE SERIE / VIN:", th_label),
            Paragraph("4T1T11AK8NU519082", th_val),
            Paragraph("TÍTULO VEHICULAR:", th_label),
            Paragraph("<b>CA - CLEAN TITLE</b> + Placa 30 Días", th_val)
        ],
        [
            Paragraph("ODÓMETRO VERIFICADO:", th_label),
            Paragraph("99,960 mi (ACTUAL RECERTIFICADO)", th_val),
            Paragraph("ESTADO OPERATIVO:", th_label),
            Paragraph("<b>RUN & DRIVE (GREEN LIGHT)</b>", th_val)
        ],
        [
            Paragraph("PATIO COPART DE SALIDA:", th_label),
            Paragraph("Copart Van Nuys #106 (Raymer St)", th_val),
            Paragraph("ORIGEN DEL LOTE:", th_label),
            Paragraph("Toyota Financial Services (Agencia)", th_val)
        ]
    ]

    t_info = Table(info_data, colWidths=[137, 137, 137, 137])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F1F5F9')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 4))

    # 3. FINANCIAL ITEMIZED LEDGER (3 cols: 238pt, 180pt, 130pt = 548pt)
    hammer_price = 6150.0
    buyer_fee = 585.0
    internet_fee = 89.0
    gate_fee = 79.0
    doc_fee = 97.0
    subtotal_fees = buyer_fee + internet_fee + gate_fee + doc_fee # 850.0
    copart_total = hammer_price + subtotal_fees # 7000.0

    ledger_data = [
        [
            Paragraph("DESCRIPCIÓN DEL CONCEPTO (ITEM / CODE)", tbl_hdr),
            Paragraph("DETALLE / NORMATIVA COPART", tbl_hdr),
            Paragraph("IMPORTE (USD)", tbl_hdr_r)
        ],
        [
            Paragraph("<b>[LOT SALE] PRECIO MARTILLO EN VIVO (HAMMER PRICE)</b>", tbl_cell),
            Paragraph("Adjudicado en tiempo real bajo Paleta Oficial #101", tbl_cell_sub),
            Paragraph(f"<b>${hammer_price:,.2f} USD</b>", tbl_cell_amt)
        ],
        [
            Paragraph("<b>[BUYF] TARIFA DE COMPRADOR COPART (BUYER FEE)</b>", tbl_cell),
            Paragraph("Arancel reglamentario según escala Copart Member", tbl_cell_sub),
            Paragraph(f"<b>${buyer_fee:,.2f} USD</b>", tbl_cell_amt)
        ],
        [
            Paragraph("<b>[VIBF] CARGO POR PUJA VIRTUAL (INTERNET BID FEE)</b>", tbl_cell),
            Paragraph("Conexión autorizada terminal en vivo Copart VB3", tbl_cell_sub),
            Paragraph(f"<b>${internet_fee:,.2f} USD</b>", tbl_cell_amt)
        ],
        [
            Paragraph("<b>[GATE] CARGO DE RETIRO EN PATIO (GATE & LOADING)</b>", tbl_cell),
            Paragraph("Maniobra de carga, precinto y salida Van Nuys #106", tbl_cell_sub),
            Paragraph(f"<b>${gate_fee:,.2f} USD</b>", tbl_cell_amt)
        ],
        [
            Paragraph("<b>[DOCF] GESTIÓN DMV CA, TÍTULO Y PLACA TEMPORAL</b>", tbl_cell),
            Paragraph("Título Limpio California endosado + Placa temporal 30 días", tbl_cell_sub),
            Paragraph(f"<b>${doc_fee:,.2f} USD</b>", tbl_cell_amt)
        ],
        [
            Paragraph("<b>[SUBT] SUBTOTAL GASTOS Y ARANCELES OFICIALES</b>", tbl_cell),
            Paragraph("Total cargos operativos Copart Member Services y DMV", tbl_cell_sub),
            Paragraph(f"<b>${subtotal_fees:,.2f} USD</b>", tbl_cell_amt)
        ],
    ]

    t_ledger = Table(ledger_data, colWidths=[238, 180, 130])
    t_ledger.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0B2E59')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,2), (-1,2), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (0,5), (-1,5), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,6), (-1,6), colors.HexColor('#F1F5F9')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_ledger)
    story.append(Spacer(1, 3))

    # 4. TOTAL BALANCE HIGHLIGHT BOX (2 cols: 310pt, 238pt = 548pt)
    tot_data = [
        [
            Paragraph(f"<b>VALOR MARTILLO (HAMMER):</b> ${hammer_price:,.2f} USD<br/><b>ARANCELES Y GASTOS COPART:</b> ${subtotal_fees:,.2f} USD", tot_left),
            Paragraph(f"TOTAL DIRECTO EN COPART:<br/><font size='13' color='#166534'><b>${copart_total:,.2f} USD</b></font>", tot_right)
        ]
    ]
    t_tot = Table(tot_data, colWidths=[310, 238])
    t_tot.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 1.0, colors.HexColor('#3B82F6')),
    ]))
    story.append(t_tot)
    story.append(Spacer(1, 4))

    # 5. PAYMENT SETTLEMENT INSTRUCTIONS & CLEARANCE SEAL (2 cols: 340pt, 208pt = 548pt)
    inst_para = Paragraph(
        "<b>INSTRUCCIONES OFICIALES DE LIQUIDACIÓN Y DESPACHO COPART:</b><br/>"
        "<b>1. Beneficiario Oficial:</b> COPART, INC. / MEMBER SETTLEMENT SERVICES<br/>"
        f"<b>2. Referencia Obligatoria:</b> LOTE #{lot_number} - JOHAN VLADIMIR RAJO ARIAS (DL: {client_id})<br/>"
        "<b>3. Modalidad:</b> Transferencia bancaria oficial (Wire Transfer) o depósito bancario autorizado.<br/>"
        f"<b>4. Retiro y Logística:</b> Salida autorizada bajo Gate Pass desde Patio Van Nuys Yard #106 con traslado directo en grúa plataforma a su domicilio en {client_loc}.<br/>"
        "<b>5. Documentación de Entrega:</b> Al acreditarse los fondos se entrega Título Limpio de California endosado a nombre del comprador y Placa Provisional válida por 30 días para rodar legalmente.",
        inst_body
    )

    seal_img = Image(seal_path, width=175, height=60) if os.path.exists(seal_path) else Paragraph('<b>[SELLO OFICIAL COPART]</b>', seal_txt)
    seal_lbl = Paragraph("<b>Copart Member Settlement & Title Division</b><br/>Van Nuys Yard #106 • Title & Gate Clearance Official", seal_txt)

    pay_data = [
        [
            inst_para,
            [Paragraph("<b>CERTIFICACIÓN OFICIAL COPART:</b>", seal_txt), Spacer(1, 1), seal_img, Spacer(1, 1), seal_lbl]
        ]
    ]

    t_pay = Table(pay_data, colWidths=[340, 208])
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#FAFAFA')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_pay)
    story.append(Spacer(1, 4))

    # 6. SECURITY HASH FOOTER
    story.append(Paragraph(
        f"ATOMIC SETTLEMENT HASH: CP-CA-{lot_number}-VANNUYS106-VB3-SOLD-6150 • COPART VERIFIED PORTAL<br/>"
        "COPART MEMBER SERVICES • VEHICLE AUCTIONEER & SETTLEMENT LICENSE #489210 • GREEN LIGHT CERTIFIED",
        footer_sec
    ))

    # Build PDF
    doc.build(story)
    print(f"Successfully generated ReportLab PDF: {pdf_out}")

    # Copy to public and brain
    shutil.copy2(pdf_out, pub_out)
    if os.path.exists(brain_dir):
        shutil.copy2(pdf_out, os.path.join(brain_dir, os.path.basename(pdf_out)))

    # Verify pages and generate preview
    doc_fitz = fitz.open(pdf_out)
    page_count = len(doc_fitz)
    print(f"Total Pages: {page_count}")

    page = doc_fitz[0]
    pix = page.get_pixmap(dpi=150)
    pix.save(preview_out)
    if os.path.exists(brain_dir):
        shutil.copy2(preview_out, os.path.join(brain_dir, "factura_johan_preview.png"))
    print(f"Rendered PNG preview: {preview_out} ({pix.width}x{pix.height})")

if __name__ == '__main__':
    generate_invoice_pdf()
