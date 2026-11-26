import os, shutil, fitz
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable

def generate_wire_slip():
    pdf_out = r"d:\SUBASTAS\FICHA_PAGO_WIRE_COPART_JOHAN_VLADIMIR.pdf"
    pub_out = r"d:\SUBASTAS\public\FICHA_PAGO_WIRE_COPART_JOHAN_VLADIMIR.pdf"
    preview_out = r"d:\SUBASTAS\public\ficha_wire_johan_preview.png"
    brain_dir = r"C:\Users\ALP\.gemini\antigravity\brain\0d1ff2e6-2163-4b55-a715-f7244a37bb54"

    logo_path = r"d:\SUBASTAS\public\copart_logo_header.png"
    barcode_path = r"d:\SUBASTAS\public\barcode_76061096.png"
    seal_path = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"

    lot_number = "76061096"
    client_name = "JOHAN VLADIMIR RAJO ARIAS"
    client_id = "DL W1947766 (California)"
    client_loc = "1800 W. Gramercy Ave Apt 54, Anaheim, CA 92801"
    client_phone = "+1 (714) 272-1351"
    veh_desc = "2022 TOYOTA CAMRY SE (SPORT EDITION)"
    vin = "4T1T11AK8NU519082"
    total_amount = 7000.0

    # Letter layout with 32pt margins (Printable width = 548pt)
    doc = SimpleDocTemplate(
        pdf_out,
        pagesize=letter,
        rightMargin=32,
        leftMargin=32,
        topMargin=26,
        bottomMargin=26
    )

    hdr_sub = ParagraphStyle('HdrSub', fontName='Helvetica-Bold', fontSize=6.8, leading=8.5, textColor=colors.HexColor('#475569'))
    hdr_meta = ParagraphStyle('HdrMeta', fontName='Helvetica-Bold', fontSize=7.0, leading=9.0, textColor=colors.HexColor('#0B2E59'), alignment=2)
    hdr_bar = ParagraphStyle('HdrBar', fontName='Helvetica-Bold', fontSize=7.2, leading=8.5, textColor=colors.HexColor('#0B2E59'), alignment=1)

    doc_title = ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=11.0, leading=13.0, textColor=colors.HexColor('#0B2E59'), alignment=1)
    doc_sub = ParagraphStyle('DocSub', fontName='Helvetica-Bold', fontSize=8.0, leading=10.0, textColor=colors.HexColor('#166534'), alignment=1)

    th_label = ParagraphStyle('ThLabel', fontName='Helvetica-Bold', fontSize=7.2, leading=9.0, textColor=colors.HexColor('#1E293B'))
    th_val = ParagraphStyle('ThVal', fontName='Helvetica', fontSize=7.2, leading=9.0, textColor=colors.HexColor('#0F172A'))

    bank_hdr_0 = ParagraphStyle('BankHdr0', fontName='Helvetica-Bold', fontSize=8.0, leading=10.0, textColor=colors.white)
    bank_hdr_1 = ParagraphStyle('BankHdr1', fontName='Helvetica-Bold', fontSize=8.0, leading=10.0, textColor=colors.HexColor('#FDE047'))

    bank_lbl = ParagraphStyle('BankLbl', fontName='Helvetica-Bold', fontSize=7.8, leading=9.5, textColor=colors.HexColor('#1E293B'))
    bank_val = ParagraphStyle('BankVal', fontName='Helvetica-Bold', fontSize=8.2, leading=10.5, textColor=colors.HexColor('#0F172A'))
    bank_val_highlight = ParagraphStyle('BankValHigh', fontName='Helvetica-Bold', fontSize=12.0, leading=14.0, textColor=colors.HexColor('#0B2E59'))

    ref_lbl = ParagraphStyle('RefLbl', fontName='Helvetica-Bold', fontSize=8.5, leading=11.0, textColor=colors.HexColor('#B91C1C'), alignment=1)
    ref_val = ParagraphStyle('RefVal', fontName='Helvetica-Bold', fontSize=11.0, leading=13.5, textColor=colors.HexColor('#0B2E59'), alignment=1)

    mobile_step = ParagraphStyle('MobileStep', fontName='Helvetica', fontSize=6.8, leading=8.5, textColor=colors.HexColor('#1E293B'))
    seal_txt = ParagraphStyle('SealTxt', fontName='Helvetica-Bold', fontSize=6.5, leading=8.0, textColor=colors.HexColor('#0B2E59'), alignment=1)
    footer_sec = ParagraphStyle('FooterSec', fontName='Courier-Bold', fontSize=5.8, leading=7.2, textColor=colors.HexColor('#64748B'), alignment=1)

    story = []

    # 1. HEADER
    logo_img = Image(logo_path, width=135, height=45) if os.path.exists(logo_path) else Paragraph('<b>COPART</b>', doc_title)
    sub_para = Paragraph("<b>COPART MEMBER SETTLEMENT & TREASURY DIVISION</b><br/>DEPARTAMENTO DE CARTERA, COBROS Y LIQUIDACIÓN<br/>Oficial de Cartera Asignado: Diego Junior Guzmán González<br/>Soporte: copartadjudications@gmail.com", hdr_sub)

    barcode_img = Image(barcode_path, width=155, height=28) if os.path.exists(barcode_path) else Paragraph('<b>* 76061096 *</b>', hdr_bar)
    bar_txt = Paragraph("<b>ORDEN WIRE LOTE #76061096</b><br/>LIQUIDACIÓN DIRECTA COPART", hdr_bar)

    meta_para = Paragraph("<b>ORDEN OFICIAL DE TRANSFERENCIA BANCARIA</b><br/>FOLIO DE PAGO: <b>WIRE-CA-76061096-SETTLE</b><br/>FECHA DE EMISIÓN: <b>25 de Noviembre de 2026</b><br/>MODALIDAD: <b>WIRE TRANSFER / APP MÓVIL / VENTANILLA</b><br/>ESTADO: <b>ORDEN ACTIVA Y VERIFICADA</b>", hdr_meta)

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

    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=3, spaceAfter=3))

    # Titles
    story.append(Paragraph("FICHA OFICIAL DE PAGO BANCARIO • INSTRUCCIONES DE TRANSFERENCIA (WIRE TRANSFER)", doc_title))
    story.append(Paragraph("LIQUIDACIÓN DE ADJUDICACIÓN DE VEHÍCULO • EMISIÓN INMEDIATA DE GATE PASS Y TÍTULO LIMPIO", doc_sub))
    story.append(Spacer(1, 3))

    # 2. CLIENT & VEHICLE SUMMARY (4 cols = 548pt)
    info_data = [
        [
            Paragraph("ADJUDICATARIO / TITULAR:", th_label),
            Paragraph(f"<b>{client_name}</b>", th_val),
            Paragraph("DNI / LICENCIA CA:", th_label),
            Paragraph(f"<b>{client_id}</b>", th_val)
        ],
        [
            Paragraph("VEHÍCULO ADJUDICADO:", th_label),
            Paragraph(f"<b>{veh_desc}</b>", th_val),
            Paragraph("LOTE COPART OFICIAL:", th_label),
            Paragraph(f"<b>#{lot_number}</b>", th_val)
        ],
        [
            Paragraph("NÚMERO DE SERIE / VIN:", th_label),
            Paragraph(f"<b>{vin}</b>", th_val),
            Paragraph("DESTINO DE ENTREGA:", th_label),
            Paragraph(f"<b>Anaheim, CA 92801</b>", th_val)
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

    # 3. BANK WIRE DETAILS TABLE (EXTRA PROMINENT FOR BANKER / MOBILE APP) (2 cols: 218pt, 330pt = 548pt)
    bank_data = [
        [
            Paragraph("CAMPO REQUERIDO POR EL BANCO / APP", bank_hdr_0),
            Paragraph("DATOS OFICIALES PARA TRANSFERENCIA (COPART TREASURY)", bank_hdr_1)
        ],
        [
            Paragraph("NOMBRE DEL TITULAR / BENEFICIARIO:<br/><i>(Account Holder / Beneficiary Name)</i>", bank_lbl),
            Paragraph("<b>Diego Junior Guzman Gonzalez</b><br/><font size='6.8' color='#475569'>Copart Cartera, Settlements & Direct Liquidation Services</font>", bank_val)
        ],
        [
            Paragraph("TIPO DE CUENTA:<br/><i>(Account Type)</i>", bank_lbl),
            Paragraph("<b>Checking Account (Cuenta Corriente Empresarial)</b>", bank_val)
        ],
        [
            Paragraph("NÚMERO DE RUTA BANCARIA:<br/><i>(Routing Number / ABA / Wire Routing)</i>", bank_lbl),
            Paragraph("<font size='13' color='#0B2E59'><b>026073008</b></font><br/><font size='6.5' color='#166534'>✓ Válido para Wire Transfer, Direct Deposit y ACH nacional</font>", bank_val_highlight)
        ],
        [
            Paragraph("NÚMERO DE CUENTA:<br/><i>(Account Number)</i>", bank_lbl),
            Paragraph("<font size='13' color='#0B2E59'><b>8333912452</b></font><br/><font size='6.5' color='#166534'>✓ Cuenta oficial habilitada para liquidación de remate</font>", bank_val_highlight)
        ],
        [
            Paragraph("NOMBRE DEL BANCO RECEPTOR:<br/><i>(Receiving Bank Name)</i>", bank_lbl),
            Paragraph("<b>Community Federal Savings Bank</b>", bank_val)
        ],
        [
            Paragraph("DIRECCIÓN DEL BANCO:<br/><i>(Bank Physical Address)</i>", bank_lbl),
            Paragraph("5 Penn Plaza, 14th Floor, New York, NY 10001, United States", bank_val)
        ],
        [
            Paragraph("MONTO EXACTO A TRANSFERIR:<br/><i>(Total Wire Amount USD)</i>", bank_lbl),
            Paragraph(f"<font size='13' color='#166534'><b>${total_amount:,.2f} USD</b></font> <font size='7.5' color='#475569'>($6,150 martillo + $850 aranceles/DMV)</font>", bank_val)
        ],
    ]

    t_bank = Table(bank_data, colWidths=[218, 330])
    t_bank.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0B2E59')),
        ('BACKGROUND', (0,1), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (1,1), (1,-1), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0,3), (-1,4), colors.HexColor('#EFF6FF')), # Highlight Routing & Account rows
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.8),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 1.0, colors.HexColor('#0B2E59')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t_bank)
    story.append(Spacer(1, 3))

    # 4. MANDATORY MEMO / REFERENCE BOX (CRITICAL FOR BANK SYSTEM)
    ref_data = [
        [
            Paragraph("★ <b>REFERENCIA / CONCEPTO OBLIGATORIO DE LA TRANSFERENCIA (MEMO / NOTE):</b>", ref_lbl)
        ],
        [
            Paragraph(f"<font size='12' color='#0B2E59'><b>LOTE 76061096 - JOHAN VLADIMIR RAJO ARIAS</b></font><br/><font size='6.8' color='#475569'>(Indicar en la casilla de 'Memo', 'Message to Beneficiary' o 'Referencia del Pago' para acreditación automática inmediata)</font>", ref_val)
        ]
    ]
    t_ref = Table(ref_data, colWidths=[548])
    t_ref.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF2F2')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 1.0, colors.HexColor('#EF4444')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FCA5A5')),
    ]))
    story.append(t_ref)
    story.append(Spacer(1, 4))

    # 5. MOBILE APP INSTRUCTIONS & CLEARANCE SEAL (2 cols: 340pt, 208pt = 548pt)
    mobile_text = Paragraph(
        "<b>GUÍA RÁPIDA PARA TRANSFERIR DESDE EL TELÉFONO O VENTANILLA:</b><br/>"
        "<b>1. En su Aplicación Móvil (Chase, BofA, Wells Fargo, etc.):</b><br/>"
        "   • Ingrese a la sección <b>'Transfer & Pay'</b> o <b>'Wire Transfer'</b>.<br/>"
        "   • Seleccione <i>'Add New Recipient' (Cuenta a nombre de persona)</i>.<br/>"
        "   • Pegue el Routing <b>026073008</b> y el Número de Cuenta <b>8333912452</b>.<br/>"
        "   • En el campo <b>Memo / Message</b> coloque: <b>LOTE 76061096 - JOHAN RAJO</b>.<br/>"
        "<b>2. En Ventanilla Bancaria:</b> Muestre esta hoja directamente en su teléfono al cajero.<br/>"
        "<b>3. Activación de Gate Pass:</b> Envíe la captura del comprobante por WhatsApp o al correo <b>copartadjudications@gmail.com</b>. De inmediato el sistema libera la unidad y programa la grúa.",
        mobile_step
    )

    seal_img = Image(seal_path, width=175, height=60) if os.path.exists(seal_path) else Paragraph('<b>[SELLO OFICIAL COPART]</b>', seal_txt)
    seal_lbl = Paragraph("<b>Departamento de Cartera & Liquidaciones</b><br/>Copart Settlement Services • Yard #106 Van Nuys", seal_txt)

    bottom_data = [
        [
            mobile_text,
            [Paragraph("<b>CERTIFICACIÓN OFICIAL DE RECAUDO:</b>", seal_txt), Spacer(1, 1), seal_img, Spacer(1, 1), seal_lbl]
        ]
    ]
    t_bottom = Table(bottom_data, colWidths=[340, 208])
    t_bottom.setStyle(TableStyle([
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
    story.append(t_bottom)
    story.append(Spacer(1, 3))

    # 6. SECURITY FOOTER
    story.append(Paragraph(
        f"ATOMIC WIRE AUTH HASH: CP-WIRE-CA-{lot_number}-SETTLE-7000 • COPART TREASURY & CARTERA DIVISION<br/>"
        "COPART MEMBER SERVICES • VEHICLE LIQUIDATION VERIFIED • COMPLIANT WITH US BANKING REGULATIONS",
        footer_sec
    ))

    # Build PDF
    doc.build(story)
    print(f"Successfully generated Wire Slip PDF: {pdf_out}")

    # Copy to public and brain
    shutil.copy2(pdf_out, pub_out)
    if os.path.exists(brain_dir):
        shutil.copy2(pdf_out, os.path.join(brain_dir, os.path.basename(pdf_out)))

    # Verify pages and generate preview
    doc_fitz = fitz.open(pdf_out)
    page_count = len(doc_fitz)
    print(f"Wire Slip Total Pages: {page_count}")

    page = doc_fitz[0]
    pix = page.get_pixmap(dpi=150)
    pix.save(preview_out)
    if os.path.exists(brain_dir):
        shutil.copy2(preview_out, os.path.join(brain_dir, "ficha_wire_johan_preview.png"))
    print(f"Rendered PNG preview: {preview_out} ({pix.width}x{pix.height})")

if __name__ == '__main__':
    generate_wire_slip()
