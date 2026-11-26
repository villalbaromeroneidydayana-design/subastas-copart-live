import docx, win32com.client, os, shutil
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

def set_cell_margins(cell, top=25, bottom=25, left=45, right=45):
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

def build_doc(font_clause, space_clause, seal_w, top_m, bot_m, filename):
    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(top_m)
    sec.bottom_margin = Inches(bot_m)
    sec.left_margin = Inches(0.50)
    sec.right_margin = Inches(0.50)
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    
    # Header
    ht = doc.add_table(rows=1, cols=2)
    ht.alignment = WD_TABLE_ALIGNMENT.CENTER
    c1, c2 = ht.rows[0].cells[0], ht.rows[0].cells[1]
    c1.width, c2.width = Inches(3.0), Inches(4.5)
    
    p_logo = c1.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_l = p_logo.add_run()
        r_l.add_picture(LOGO_IMAGE_PATH, width=Inches(1.6))
        
    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(1)
    p_sub.paragraph_format.space_after = Pt(0)
    r_s = p_sub.add_run("CERTIFIED BROKER & BIDDER NETWORK\nLICENCIA BROKER ESTADAL: #BK-78921-USA")
    r_s.font.name = "Arial"
    r_s.font.size = Pt(7.2)
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
    r_m.font.size = Pt(7.5)
    r_m.font.bold = True
    r_m.font.color.rgb = RGBColor(11, 46, 89)
    
    # Divider
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(2)
    p_div.paragraph_format.space_after = Pt(3)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 70)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(8.5)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6)
    
    # Title
    pt = doc.add_paragraph()
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(1)
    rt = pt.add_run("CONTRATO DE MANDATO Y GESTIÓN DE COMPRA EN SUBASTA")
    rt.font.name = "Arial Black"
    rt.font.size = Pt(11)
    rt.font.color.rgb = RGBColor(11, 46, 89)
    
    ps = doc.add_paragraph()
    ps.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ps.paragraph_format.space_before = Pt(0)
    ps.paragraph_format.space_after = Pt(3)
    rts = ps.add_run("CON GARANTÍA DE PRESUPUESTO AUTORIZADO Y RIESGO FINANCIERO CERO ($0 USD)")
    rts.font.name = "Arial"
    rts.font.size = Pt(8.5)
    rts.font.bold = True
    rts.font.color.rgb = RGBColor(185, 28, 28)
    
    # Table
    it = doc.add_table(rows=5, cols=4)
    it.alignment = WD_TABLE_ALIGNMENT.CENTER
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
                r.font.size = Pt(8)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                c.width = Inches(1.90)
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(8.2)
                if "PRESUPUESTO" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(185, 28, 28)
                elif "HONORARIOS" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 122, 60)
                else:
                    r.font.color.rgb = RGBColor(15, 23, 42)
                    
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
        p.paragraph_format.space_before = Pt(space_clause)
        p.paragraph_format.space_after = Pt(space_clause * 0.4)
        p.paragraph_format.line_spacing = 1.06
        
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
    sc1, sc2 = st.rows[0].cells[0], st.rows[0].cells[1]
    sc1.width, sc2.width = Inches(3.72), Inches(3.72)
    set_cell_background(sc1, "F8FAFC")
    set_cell_background(sc2, "F8FAFC")
    set_cell_margins(sc1, 20, 20, 40, 40)
    set_cell_margins(sc2, 20, 20, 40, 40)
    
    sp1 = sc1.paragraphs[0]
    sp1.paragraph_format.space_before = Pt(0)
    sp1.paragraph_format.space_after = Pt(1)
    sp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bl = sp1.add_run("POR EL BROKER AUTORIZADO (COPART PARTNER):\n")
    r_bl.font.name = "Arial"
    r_bl.font.size = Pt(7.5)
    r_bl.font.bold = True
    r_bl.font.color.rgb = RGBColor(11, 46, 89)
    
    if os.path.exists(SEAL_IMAGE_PATH):
        r_img = sp1.add_run()
        r_img.add_picture(SEAL_IMAGE_PATH, width=Inches(seal_w))
        
    p_bm = sc1.add_paragraph()
    p_bm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bm.paragraph_format.space_before = Pt(0)
    p_bm.paragraph_format.space_after = Pt(0)
    r_bt = p_bm.add_run("CERTIFICACIÓN DE REPRESENTACIÓN Y FIRMA DIGITAL")
    r_bt.font.name = "Arial"
    r_bt.font.size = Pt(7)
    r_bt.font.bold = True
    r_bt.font.color.rgb = RGBColor(11, 46, 89)
    
    sp2 = sc2.paragraphs[0]
    sp2.paragraph_format.space_before = Pt(0)
    sp2.paragraph_format.space_after = Pt(1)
    sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cl = sp2.add_run("POR EL COMPRADOR (MANDANTE):\n\n")
    r_cl.font.name = "Arial"
    r_cl.font.size = Pt(7.5)
    r_cl.font.bold = True
    r_cl.font.color.rgb = RGBColor(11, 46, 89)
    sp2.add_run("\n___________________________________\n")
    
    p_cm = sc2.add_paragraph()
    p_cm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cm.paragraph_format.space_before = Pt(2)
    p_cm.paragraph_format.space_after = Pt(0)
    r_cn = p_cm.add_run("NOMBRE: Gustavo Medal\nID / DNI: Registrado / Cliente Autorizado\nAceptado vía Confirmación WhatsApp / Telefónica")
    r_cn.font.name = "Arial"
    r_cn.font.size = Pt(7.5)
    r_cn.font.bold = True
    r_cn.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.save(filename)

if __name__ == "__main__":
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    test_file = r"d:\SUBASTAS\test_opt.docx"
    candidates = [
        (8.5, 2.5, 3.1, 0.35, 0.35),
        (8.3, 2.0, 3.0, 0.35, 0.35),
        (8.1, 1.8, 2.9, 0.32, 0.32),
        (8.0, 1.6, 2.9, 0.32, 0.32),
    ]
    
    for fc, sc, sw, tm, bm in candidates:
        build_doc(fc, sc, sw, tm, bm, test_file)
        doc_w = word.Documents.Open(os.path.abspath(test_file))
        pages = doc_w.ComputeStatistics(2)
        doc_w.Close()
        print(f"Font: {fc}pt, Space: {sc}pt, Seal: {sw}in, Margins: {tm}in -> Pages: {pages}")
        if pages == 1:
            print(f">>> OPTIMAL FOUND: font={fc}pt, space={sc}pt, seal={sw}in <<<")
            
            # Now build the final Gustavo contract with these exact optimal settings!
            final_docx = r"d:\SUBASTAS\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.docx"
            final_pdf = r"d:\SUBASTAS\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.pdf"
            build_doc(fc, sc, sw, tm, bm, final_docx)
            
            doc_final = word.Documents.Open(os.path.abspath(final_docx))
            doc_final.SaveAs(os.path.abspath(final_pdf), FileFormat=17)
            doc_final.Close()
            
            pub_pdf = r"d:\SUBASTAS\public\CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.pdf"
            shutil.copy2(final_pdf, pub_pdf)
            print(f"Successfully generated 1-page PDF: {final_pdf}")
            break
            
    word.Quit()
