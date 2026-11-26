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

def set_cell_margins(cell, top=30, bottom=30, left=50, right=50):
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

def create_client_contract(client_data, output_docx_path=None, convert_pdf=True):
    """
    Genera un contrato oficial de mandato en 1 sola hoja con la proporción y diseño dorado perfecto.
    """
    if not output_docx_path:
        sanitized_name = client_data.get("nombre_cliente", "CLIENTE").upper().replace(" ", "_")
        lote = client_data.get("lote", "LOTE")
        output_docx_path = os.path.join(r"d:\SUBASTAS", f"CONTRATO_{sanitized_name}_{lote}.docx")
        
    doc = docx.Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.38)
    sec.bottom_margin = Inches(0.38)
    sec.left_margin = Inches(0.52)
    sec.right_margin = Inches(0.52)
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
    else:
        r_l = p_logo.add_run("COPART BROKER NETWORK")
        r_l.font.name = "Arial Black"
        r_l.font.size = Pt(13)
        r_l.font.color.rgb = RGBColor(11, 46, 89)
        
    p_sub = c1.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(0)
    r_s = p_sub.add_run("CERTIFIED BROKER & BIDDER NETWORK\nLICENCIA: #BK-78921-USA | copartadjudications@gmail.com")
    r_s.font.name = "Arial"
    r_s.font.size = Pt(7.0)
    r_s.font.bold = True
    r_s.font.color.rgb = RGBColor(71, 85, 105)
    
    p_meta = c2.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    r_m = p_meta.add_run(
        f"CONTRATO OFICIAL DE MANDATO Y REPRESENTACIÓN\n"
        f"EXPEDIENTE: {client_data.get('expediente', 'EXP-2026-COPART')} | FECHA: {client_data.get('fecha', 'Noviembre de 2026')}\n"
        f"POSTOR TITULAR AUTORIZADO: PALETA OFICIAL #101"
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
        ("COMPRADOR / MANDANTE:", client_data.get('nombre_cliente', '[NOMBRE DEL CLIENTE]'), "TELÉFONO / WHATSAPP:", client_data.get('telefono', '[WHATSAPP]')),
        ("ESTADO / DESTINO:", client_data.get('ubicacion', '[CIUDAD / ESTADO]'), "DNI / IDENTIFICACIÓN:", client_data.get('identificacion', '[DNI / ID / PASAPORTE]')),
        ("VEHÍCULO DESIGNADO:", client_data.get('vehiculo', '[AÑO MARCA MODELO]'), "NÚMERO DE LOTE COPART:", str(client_data.get('lote', '[LOTE]'))),
        ("NÚMERO DE VIN:", client_data.get('vin', '[VIN OFICIAL]'), "TIPO DE TÍTULO OFICIAL:", client_data.get('titulo', 'CLEAN TITLE (Título Limpio)')),
        ("PRESUPUESTO TOPE AUTORIZADO:", client_data.get('presupuesto_tope', '$[PRESUPUESTO] USD (Flexible con Autorización)'), "HONORARIOS BROKER (ÉXITO):", client_data.get('honorarios', '$400 USD (Al recibir llaves en mano)'))
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
                r.font.size = Pt(8.8)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                c.width = Inches(1.85)
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(9.2)
                if "PRESUPUESTO" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(185, 28, 28)
                elif "HONORARIOS" in row_d[c_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 122, 60)
                else:
                    r.font.color.rgb = RGBColor(15, 23, 42)
                    
    # Clauses
    nom = client_data.get('nombre_cliente', 'EL COMPRADOR')
    veh = client_data.get('vehiculo', 'el vehículo designado')
    lote = client_data.get('lote', 'asignado')
    vin = client_data.get('vin', 'registrado')
    tit = client_data.get('titulo', 'CLEAN TITLE')
    tope = client_data.get('presupuesto_tope', '$2,500 USD (Flexible con Autorización)')
    hon = client_data.get('honorarios', '$400 USD (Al recibir llaves en mano)')
    
    clausulas = [
        ("PRIMERA. OBJETO DEL MANDATO", 
         f"El COMPRADOR ({nom}) confiere mandato comercial expreso al BROKER AUTORIZADO (Lic. Estatal #BK-78921-USA) para que, en su nombre y representación mediante la Paleta Oficial de Postor #101, participe en la subasta en vivo de Copart para la adjudicación del lote especificado."),
        
        ("SEGUNDA. IDENTIFICACIÓN Y CONDICIÓN DEL LOTE", 
         f"El mandato se circunscribe al vehículo {veh}, Lote Copart #{lote}, VIN {vin}. Consta certificación oficial 'Run and Drive' (motor arranca y marcha operativa) amparado con {tit}, apto para traspaso legal y registro vehicular."),
        
        ("TERCERA. PRESUPUESTO AUTORIZADO Y GARANTÍA DE RIESGO CERO ($0 USD)", 
         f"El Broker se compromete a pujar competitivamente hasta el tope inicial acordado de {tope}. Dicho límite podrá incrementarse durante el curso de la subasta exclusivamente con la autorización o confirmación expresa del COMPRADOR vía telefónica o WhatsApp. Si la subasta supera el monto autorizado sin confirmación o no se adjudica el lote, el mandato cesa inmediatamente con GARANTÍA DE RIESGO CERO: el COMPRADOR no pagará penalización, comisión ni costo alguno ($0 USD)."),
        
        ("CUARTA. HONORARIOS CONDICIONADOS A ENTREGA DE LLAVES", 
         f"Los honorarios profesionales corresponden a {hon}. Ambas partes pactan como condición expresa que dicho monto será exigible ÚNICA Y EXCLUSIVAMENTE cuando el vehículo sea entregado al COMPRADOR con sus llaves físicas originales y título legal. Queda expresamente prohibido solicitar cobros o anticipos previos a dicha entrega."),
        
        ("QUINTA. PROTOCOLO DE LIQUIDACIÓN Y TRASPASO", 
         "Al resultar ganadora la Paleta #101 dentro del presupuesto autorizado, Copart emitirá la factura oficial. El COMPRADOR liquidará el valor martillado mediante transferencia oficial para la emisión del certificado de propiedad a su nombre y la correspondiente orden de retiro."),
        
        ("SEXTA. VALIDEZ JURÍDICA Y FIRMA REMOTA", 
         "Las partes reconocen plena validez legal a este contrato, aceptando su suscripción física, digital o mediante confirmación expresa de voluntad remitida por el número de WhatsApp registrado del Comprador, conforme a las leyes mercantiles de EE. UU.")
    ]
    
    for num, texto in clausulas:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4.8)
        p.paragraph_format.space_after = Pt(2.2)
        p.paragraph_format.line_spacing = 1.14
        
        r_n = p.add_run(f"{num}: ")
        r_n.font.name = "Arial"
        r_n.font.size = Pt(9.8)
        r_n.font.bold = True
        r_n.font.color.rgb = RGBColor(11, 46, 89)
        
        r_t = p.add_run(texto)
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.8)
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
        r_img.add_picture(SEAL_IMAGE_PATH, width=Inches(3.5))
        
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
    id_val = client_data.get('identificacion', 'Registrado / Cliente Autorizado')
    r_cn = p_cm.add_run(f"NOMBRE: {nom}\nID / DNI: {id_val}\nAceptado vía Confirmación WhatsApp / Telefónica")
    r_cn.font.name = "Arial"
    r_cn.font.size = Pt(8.0)
    r_cn.font.bold = True
    r_cn.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.save(output_docx_path)
    print(f"Created DOCX: {output_docx_path}")
    
    output_pdf_path = output_docx_path.replace(".docx", ".pdf")
    if convert_pdf:
        try:
            word = win32com.client.Dispatch("Word.Application")
            word.Visible = False
            d = word.Documents.Open(os.path.abspath(output_docx_path))
            d.SaveAs(os.path.abspath(output_pdf_path), FileFormat=17)
            d.Close()
            word.Quit()
            
            # Copy to public folder
            pub_pdf = os.path.join(r"d:\SUBASTAS\public", os.path.basename(output_pdf_path))
            shutil.copy2(output_pdf_path, pub_pdf)
            print(f"Created & published PDF: {output_pdf_path}")
        except Exception as e:
            print(f"PDF conversion note: {e}")
            
    return output_docx_path, output_pdf_path

if __name__ == "__main__":
    # Generar la Plantilla Maestra Oficial Reutilizable
    plantilla_maestra = {
        "expediente": "EXP-2026-COPART-MASTER",
        "fecha": "Noviembre de 2026",
        "nombre_cliente": "[NOMBRE Y APELLIDOS DEL CLIENTE]",
        "telefono": "[NÚMERO DE WHATSAPP]",
        "ubicacion": "[CIUDAD Y ESTADO DE ENTREGA]",
        "identificacion": "[DNI / ID / LICENCIA / PASAPORTE]",
        "vehiculo": "[AÑO MARCA MODELO VERSIÓN]",
        "lote": "[NÚMERO DE LOTE COPART]",
        "vin": "[NÚMERO DE VIN OFICIAL]",
        "titulo": "[ESTADO] - CLEAN TITLE (Título Limpio)",
        "presupuesto_tope": "$[MONTO] USD (Flexible con Autorización)",
        "honorarios": "$400 USD (Al recibir llaves en mano)"
    }
    
    create_client_contract(
        plantilla_maestra, 
        output_docx_path=r"d:\SUBASTAS\PLANTILLA_MAESTRA_CONTRATO_BROKER_COPART.docx",
        convert_pdf=True
    )
    print("Plantilla Maestra guardada con exito.")
