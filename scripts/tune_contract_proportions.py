import docx, win32com.client, os, shutil, fitz
from PIL import Image
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

def set_cell_margins(cell, top=40, bottom=40, left=60, right=60):
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

def generate_balanced_contract(
    filename, 
    font_clause=9.5, 
    line_spacing=1.14, 
    space_before=5.0, 
    space_after=2.5,
    seal_width=3.4,
    table_font=8.8,
    top_margin=0.45,
    bottom_margin=0.45
):
    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(top_margin)
    sec.bottom_margin = Inches(bottom_margin)
    sec.left_margin = Inches(0.55)
    sec.right_margin = Inches(0.55)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # 1. Header (Logo Copart + Official Metadata)
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    ht.autofit = False
    c1, c2 = ht.rows[0].cells[0], ht.rows[0].cells[1]
    c1.width, c2.width = Inches(3.2), Inches(4.2)
    
    p_logo = c1.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_l = p_logo.add_run()
        r_l.add_picture(LOGO_IMAGE_PATH, width=Inches(1.7))
        
    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(0)
    r_s = p_sub.add_run("CERTIFIED BROKER & BIDDER NETWORK\nLICENCIA BROKER ESTADAL: #BK-78921-USA")
    r_s.font.name = "Arial"
    r_s.font.size = Pt(7.5)
    r_s.font.bold = True
    r_s.font.color.rgb = RGBColor(71, 85, 105)
    
    p_meta = c2.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    r_m = p_meta.add_run(
        "CONTRATO OFICIAL DE MANDATO Y REPRESENTACIÓN\n"
        "EXPEDIENTE: EXP-2026-TX-67797166 | FECHA: 21 de Noviembre de 2026\n"
        "POSTOR TITULAR AUTORIZADO: PALETA OFICIAL #101"
    )
    r_m.font.name = "Arial"
    r_m.font.size = Pt(8.0)
    r_m.font.bold = True
    r_m.font.color.rgb = RGBColor(11, 46, 89)
    
    # Divider
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(3)
    p_div.paragraph_format.space_after = Pt(4)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 68)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(9)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6) # Copart Gold
    
    # Title
    pt = doc.add_paragraph()
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(1.5)
    rt = pt.add_run("CONTRATO DE MANDATO Y GESTIÓN DE COMPRA EN SUBASTA")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(11.5)
    rt.font.color.rgb = RGBColor(11, 46, 89)
    
    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(4)
    rts = ps.add_run("CON GARANTÍA DE PRESUPUESTO AUTORIZADO Y RIESGO FINANCIERO CERO ($0 USD)")
    rts.font.name = "Arial"
    rts.font.size = Pt(9.0)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(185, 28, 28)
    
    # Summary Table
    it = doc.add_table(rows=5, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
    it.autofit = False
    
    table_fields = [
        ("COMPRADOR / MANDANTE:", "Gustavo Medal", "TELÉFONO / WHATSAPP:", "Contacto Directo WhatsApp"),
        ("ESTADO / DESTINO:", "Estados Unidos (USA)", "DNI / IDENTIFICACIÓN:", "Registrado / Cliente Autorizado"),
        ("VEHÍCULO DESIGNADO:", "2015 TOYOTA COROLLA LE SEDÁN (138,551 mi)", "NÚMERO DE LOTE COPART:", "67797166"),
        ("NÚMERO DE VIN:", "2T1BURHE5FC482910", "TIPO DE TÍTULO OFICIAL:", "TX - CLEAN TITLE (Título Limpio)"),
        ("PRESUPUESTO TOPE AUTORIZADO:", "$2,500 USD (Flexible con Autorización)", "HONORARIOS BROKER (ÉXITO):", "$400 USD (Al recibir llaves en mano)")
    ]
    
    for r_idx, row_d in enumerate(table_fields):
        row = it.rows[r_idx]
        for c_idx in range(4):
            c = row.cells[c_idx]
            set_cell_margins(c, 30, 30, 50, 50)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            val = row_d[c_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            if c_idx in (0, 2):
                c.width = Inches(1.85)
                set_cell_background(c, "F1F5F9")
                r.font.size = Pt(table_font - 0.4)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                c.width = Inches(1.85)
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(table_font)
                if "PRESUPUESTO" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(185, 28, 28)
                elif "HONORARIOS" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 122, 60)
                else:
                    r.font.color.rgb = RGBColor(15, 23, 42)
                    
    # Clauses
    clausulas = [
        ("PRIMERA. OBJETO DEL MANDATO", 
         "El COMPRADOR (Gustavo Medal) confiere mandato comercial expreso al BROKER AUTORIZADO (Lic. Estatal #BK-78921-USA) para que, en su nombre y representación mediante la Paleta Oficial de Postor #101, participe en la subasta en vivo de Copart para la adjudicación del lote especificado."),
        
        ("SEGUNDA. IDENTIFICACIÓN Y CONDICIÓN DEL LOTE", 
         "El mandato se circunscribe al vehículo 2015 TOYOTA COROLLA LE SEDÁN (138,551 mi), Lote Copart #67797166, VIN 2T1BURHE5FC482910. Consta certificación oficial 'Run and Drive' (motor arranca y marcha operativa) amparado con TX - CLEAN TITLE (Título Limpio), apto para traspaso legal y registro vehicular."),
        
        ("TERCERA. PRESUPUESTO AUTORIZADO Y GARANTÍA DE RIESGO CERO ($0 USD)", 
         "El Broker se compromete a pujar competitivamente hasta el tope inicial acordado de $2,500 USD (Flexible con Autorización). Dicho límite podrá incrementarse durante el curso de la subasta exclusivamente con la autorización o confirmación expresa del COMPRADOR vía telefónica o WhatsApp. Si la subasta supera el monto autorizado sin confirmación o no se adjudica el lote, el mandato cesa inmediatamente con GARANTÍA DE RIESGO CERO: el COMPRADOR no pagará penalización, comisión ni costo alguno ($0 USD)."),
        
        ("CUARTA. HONORARIOS CONDICIONADOS A ENTREGA DE LLAVES", 
         "Los honorarios profesionales corresponden a $400 USD (Al recibir llaves en mano). Ambas partes pactan como condición expresa que dicho monto será exigible ÚNICA Y EXCLUSIVAMENTE cuando el vehículo sea entregado al COMPRADOR con sus llaves físicas originales y título legal. Queda expresamente prohibido solicitar cobros o anticipos previos a dicha entrega."),
        
        ("QUINTA. PROTOCOLO DE LIQUIDACIÓN Y TRASPASO", 
         "Al resultar ganadora la Paleta #101 dentro del presupuesto autorizado, Copart emitirá la factura oficial. El COMPRADOR liquidará el valor martillado mediante transferencia oficial para la emisión del certificado de propiedad a su nombre y la correspondiente orden de retiro."),
        
        ("SEXTA. VALIDEZ JURÍDICA Y FIRMA REMOTA", 
         "Las partes reconocen plena validez legal a este contrato, aceptando su suscripción física, digital o mediante confirmación expresa de voluntad remitida por el número de WhatsApp registrado del Comprador, conforme a las leyes mercantiles de EE. UU.")
    ]
    
    for num, texto in clausulas:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        
        r_n = p.add_run(f"{num}: ")
        r_n.font.name = "Arial"
        r_n.font.size = Pt(font_clause)
        r_n.font.bold = True
        r_n.font.color.rgb = RGBColor(11, 46, 89)
        
        r_t = p.add_run(texto)
        r_t.font.name = "Arial"
        r_t.font.size = Pt(font_clause)
        r_t.font.color.rgb = RGBColor(30, 41, 59)
        
    # Signature block
    st = doc.add_table(rows=1, cols=2)
    st.alignment = WD_TABLE_ALIGNMENT.CENTER
    st.autofit = False
    sc1, sc2 = st.rows[0].cells[0], st.rows[0].cells[1]
    sc1.width, sc2.width = Inches(3.7), Inches(3.7)
    set_cell_background(sc1, "F8FAFC")
    set_cell_background(sc2, "F8FAFC")
    set_cell_margins(sc1, 25, 25, 45, 45)
    set_cell_margins(sc2, 25, 25, 45, 45)
    
    sp1 = sc1.paragraphs[0]
    sp1.paragraph_format.space_before = Pt(0)
    sp1.paragraph_format.space_after = Pt(1)
    sp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bl = sp1.add_run("POR EL BROKER AUTORIZADO (COPART PARTNER):\n")
    r_bl.font.name = "Arial"
    r_bl.font.size = Pt(8.0)
    r_bl.font.bold = True
    r_bl.font.color.rgb = RGBColor(11, 46, 89)
    
    if os.path.exists(SEAL_IMAGE_PATH):
        r_img = sp1.add_run()
        r_img.add_picture(SEAL_IMAGE_PATH, width=Inches(seal_width))
        
    p_bm = sc1.add_paragraph()
    p_bm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bm.paragraph_format.space_before = Pt(1)
    p_bm.paragraph_format.space_after = Pt(0)
    r_bt = p_bm.add_run("CERTIFICACIÓN DE REPRESENTACIÓN Y FIRMA DIGITAL")
    r_bt.font.name = "Arial"
    r_bt.font.size = Pt(7.2)
    r_bt.font.bold = True
    r_bt.font.color.rgb = RGBColor(11, 46, 89)
    
    sp2 = sc2.paragraphs[0]
    sp2.paragraph_format.space_before = Pt(0)
    sp2.paragraph_format.space_after = Pt(2)
    sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cl = sp2.add_run("POR EL COMPRADOR (MANDANTE):\n\n")
    r_cl.font.name = "Arial"
    r_cl.font.size = Pt(8.0)
    r_cl.font.bold = True
    r_cl.font.color.rgb = RGBColor(11, 46, 89)
    sp2.add_run("\n___________________________________\n")
    
    p_cm = sc2.add_paragraph()
    p_cm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cm.paragraph_format.space_before = Pt(3)
    p_cm.paragraph_format.space_after = Pt(0)
    r_cn = p_cm.add_run("NOMBRE: Gustavo Medal\nID / DNI: Registrado / Cliente Autorizado\nAceptado vía Confirmación WhatsApp / Telefónica")
    r_cn.font.name = "Arial"
    r_cn.font.size = Pt(8.0)
    r_cn.font.bold = True
    r_cn.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.save(filename)
    return filename

def measure_pdf_balance(pdf_path):
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    if page_count != 1:
        return page_count, 0, 0
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    w, h = pix.width, pix.height
    bottom = 0
    # check row pixels
    samples = pix.samples
    # samples is bytes: w * h * n
    n = pix.n
    for y in range(h - 1, 0, -1):
        row_start = y * w * n
        is_dark = False
        for x in range(0, w, 2):
            idx = row_start + x * n
            r, g, b = samples[idx], samples[idx+1], samples[idx+2]
            if r < 240 or g < 240 or b < 240:
                is_dark = True
                break
        if is_dark:
            bottom = y
            break
    blank_px = h - bottom
    blank_pct = (blank_px / h) * 100
    return 1, bottom, blank_pct

if __name__ == "__main__":
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    test_docx = r"d:\SUBASTAS\test_opt.docx"
    test_pdf = r"d:\SUBASTAS\test_opt.pdf"
    
    # Try different font and spacing combinations to find the one that fills the page nicely (~6-10% margin at bottom)
    configs = [
        # font, line_space, space_before, space_after, seal_w, table_font, top_m, bot_m
        (9.5, 1.15, 5.0, 2.5, 3.4, 8.8, 0.45, 0.45),
        (9.8, 1.16, 5.5, 2.8, 3.5, 9.0, 0.40, 0.40),
        (10.0, 1.18, 6.0, 3.0, 3.5, 9.2, 0.40, 0.40),
        (10.2, 1.20, 6.5, 3.2, 3.6, 9.4, 0.38, 0.38),
        (10.5, 1.22, 7.0, 3.5, 3.6, 9.5, 0.35, 0.35),
    ]
    
    best_config = None
    
    for cfg in configs:
        fc, ls, sb, sa, sw, tf, tm, bm = cfg
        generate_balanced_contract(test_docx, fc, ls, sb, sa, sw, tf, tm, bm)
        d = word.Documents.Open(os.path.abspath(test_docx))
        d.SaveAs(os.path.abspath(test_pdf), FileFormat=17)
        d.Close()
        
        pages, bottom, blank_pct = measure_pdf_balance(test_pdf)
        print(f"Font {fc}pt, Spacing {ls}, SpaceBef {sb}pt -> Pages: {pages}, Bottom: {bottom}px, Blank: {blank_pct:.1f}%")
        if pages == 1:
            best_config = cfg
            
    print(f"\nApplying best config: {best_config}")
    fc, ls, sb, sa, sw, tf, tm, bm = best_config
    final_docx = r"d:\SUBASTAS\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.docx"
    final_pdf = r"d:\SUBASTAS\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.pdf"
    generate_balanced_contract(final_docx, fc, ls, sb, sa, sw, tf, tm, bm)
    
    d = word.Documents.Open(os.path.abspath(final_docx))
    d.SaveAs(os.path.abspath(final_pdf), FileFormat=17)
    d.Close()
    
    pub_pdf = r"d:\SUBASTAS\public\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.pdf"
    shutil.copy2(final_pdf, pub_pdf)
    
    pages, bottom, blank_pct = measure_pdf_balance(final_pdf)
    print(f"FINAL GUSTAVO PDF: Pages={pages}, Bottom={bottom}px, Blank space at bottom={blank_pct:.1f}%")
    
    word.Quit()
