import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os
import shutil

SEAL_IMAGE_PATH = r"d:\SUBASTAS\public\sello_oficial_copart_broker.png"
LOGO_IMAGE_PATH = r"d:\SUBASTAS\public\copart_logo_header.png"

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=20, bottom=20, left=40, right=40):
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

def create_contract_docx(filename, client_data, seal_width_inches=2.7, font_size_clause=7.5):
    doc = docx.Document()
    
    # Strictly 1-page margins
    section = doc.sections[0]
    section.top_margin = Inches(0.32)
    section.bottom_margin = Inches(0.30)
    section.left_margin = Inches(0.50)
    section.right_margin = Inches(0.50)
    section.page_width = Inches(8.5)
    section.page_height = Inches(11.0)
    
    # 1. Header (Logo Copart + Official Metadata)
    h_table = doc.add_table(rows=1, cols=2)
    h_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_table.autofit = False
    
    c_logo = h_table.rows[0].cells[0]
    c_meta = h_table.rows[0].cells[1]
    c_logo.width = Inches(2.8)
    c_meta.width = Inches(4.7)
    
    # Logo Copart
    p_logo = c_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_logo.paragraph_format.space_before = Pt(0)
    p_logo.paragraph_format.space_after = Pt(0)
    if os.path.exists(LOGO_IMAGE_PATH):
        r_logo = p_logo.add_run()
        r_logo.add_picture(LOGO_IMAGE_PATH, width=Inches(1.5))
    else:
        r_logo = p_logo.add_run("COPART BROKER NETWORK")
        r_logo.font.name = "Arial Black"
        r_logo.font.size = Pt(13)
        r_logo.font.color.rgb = RGBColor(11, 46, 89)
        
    p_lsub = c_logo.add_paragraph()
    p_lsub.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_lsub.paragraph_format.space_before = Pt(1)
    p_lsub.paragraph_format.space_after = Pt(0)
    r_sub = p_lsub.add_run("CERTIFIED BROKER & BIDDER NETWORK\nLICENCIA BROKER ESTADAL: #BK-78921-USA")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(6.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    
    # Metadata Right
    p_meta = c_meta.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(0)
    
    r_meta = p_meta.add_run(
        f"CONTRATO OFICIAL DE MANDATO Y REPRESENTACIÓN\n"
        f"EXPEDIENTE: {client_data['expediente']} | FECHA: {client_data['fecha']}\n"
        f"POSTOR TITULAR AUTORIZADO: PALETA OFICIAL #101"
    )
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(7)
    r_meta.font.bold = True
    r_meta.font.color.rgb = RGBColor(11, 46, 89)
    
    # Divider bar
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(2)
    p_div.paragraph_format.space_after = Pt(2)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bar = p_div.add_run("―" * 75)
    r_bar.font.name = "Arial"
    r_bar.font.size = Pt(8)
    r_bar.font.bold = True
    r_bar.font.color.rgb = RGBColor(217, 119, 6) # Copart Gold
    
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(1)
    
    r_t = p_title.add_run("CONTRATO DE MANDATO Y GESTIÓN DE COMPRA EN SUBASTA")
    r_t.font.name = "Arial Black"
    r_t.font.size = Pt(10)
    r_t.font.color.rgb = RGBColor(11, 46, 89)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(2)
    r_ts = p_sub.add_run("CON GARANTÍA DE PRESUPUESTO AUTORIZADO Y RIESGO FINANCIERO CERO ($0 USD)")
    r_ts.font.name = "Arial"
    r_ts.font.size = Pt(8)
    r_ts.font.bold = True
    r_ts.font.color.rgb = RGBColor(185, 28, 28)
    
    # Summary Table
    info_table = doc.add_table(rows=5, cols=4)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_table.autofit = False
    
    table_fields = [
        ("COMPRADOR / MANDANTE:", client_data['nombre_cliente'], "TELÉFONO / WHATSAPP:", client_data['telefono']),
        ("ESTADO / DESTINO:", client_data['ubicacion'], "DNI / IDENTIFICACIÓN:", client_data['identificacion']),
        ("VEHÍCULO DESIGNADO:", client_data['vehiculo'], "NÚMERO DE LOTE COPART:", client_data['lote']),
        ("NÚMERO DE VIN:", client_data['vin'], "TIPO DE TÍTULO OFICIAL:", client_data['titulo']),
        ("PRESUPUESTO TOPE AUTORIZADO:", client_data['presupuesto_tope'], "HONORARIOS BROKER (ÉXITO):", client_data['honorarios'])
    ]
    
    for row_idx, data in enumerate(table_fields):
        row = info_table.rows[row_idx]
        for col_idx in range(4):
            c = row.cells[col_idx]
            set_cell_margins(c, 20, 20, 35, 35)
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            
            val = data[col_idx]
            r = p.add_run(val)
            r.font.name = "Arial"
            
            if col_idx in (0, 2):
                c.width = Inches(1.85)
                set_cell_background(c, "F1F5F9")
                r.font.size = Pt(7)
                r.font.bold = True
                r.font.color.rgb = RGBColor(30, 41, 59)
            else:
                c.width = Inches(1.90)
                set_cell_background(c, "FFFFFF")
                r.font.size = Pt(7.5)
                if "PRESUPUESTO" in data[col_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(185, 28, 28)
                elif "HONORARIOS" in data[col_idx-1]:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 122, 60)
                else:
                    r.font.color.rgb = RGBColor(15, 23, 42)
                    
    # CLÁUSULAS
    clausulas = [
        ("PRIMERA. OBJETO DEL MANDATO", 
         f"El COMPRADOR ({client_data['nombre_cliente']}) confiere mandato comercial expreso al BROKER AUTORIZADO (Lic. Estatal #BK-78921-USA) para que, en su nombre y representación mediante la Paleta Oficial de Postor #101, participe en la subasta en vivo de Copart para la adjudicación del lote especificado."),
        
        ("SEGUNDA. IDENTIFICACIÓN Y CONDICIÓN DEL LOTE", 
         f"El mandato se circunscribe al vehículo {client_data['vehiculo']}, Lote Copart #{client_data['lote']}, VIN {client_data['vin']}. Consta certificación oficial 'Run and Drive' (motor arranca y marcha operativa) amparado con {client_data['titulo']}, apto para traspaso legal y registro vehicular."),
        
        ("TERCERA. PRESUPUESTO AUTORIZADO Y GARANTÍA DE RIESGO CERO ($0 USD)", 
         f"El Broker se compromete a pujar competitivamente hasta el tope inicial acordado de {client_data['presupuesto_tope']}. Dicho límite podrá incrementarse durante el curso de la subasta exclusivamente con la autorización o confirmación expresa del COMPRADOR vía telefónica o WhatsApp. Si la subasta supera el monto autorizado sin confirmación o no se adjudica el lote, el mandato cesa inmediatamente con GARANTÍA DE RIESGO CERO: el COMPRADOR no pagará penalización, comisión ni costo alguno ($0 USD)."),
        
        ("CUARTA. HONORARIOS CONDICIONADOS A ENTREGA DE LLAVES", 
         f"Los honorarios profesionales corresponden a {client_data['honorarios']}. Ambas partes pactan como condición expresa que dicho monto será exigible ÚNICA Y EXCLUSIVAMENTE cuando el vehículo sea entregado al COMPRADOR con sus llaves físicas originales y título legal. Queda expresamente prohibido solicitar cobros o anticipos previos a dicha entrega."),
        
        ("QUINTA. PROTOCOLO DE LIQUIDACIÓN Y TRASPASO", 
         "Al resultar ganadora la Paleta #101 dentro del presupuesto autorizado, Copart emitirá la factura oficial. El COMPRADOR liquidará el valor martillado mediante transferencia oficial para la emisión del certificado de propiedad a su nombre y la correspondiente orden de retiro."),
        
        ("SEXTA. VALIDEZ JURÍDICA Y FIRMA REMOTA", 
         "Las partes reconocen plena validez legal a este contrato, aceptando su suscripción física, digital o mediante confirmación expresa de voluntad remitida por el número de WhatsApp registrado del Comprador, conforme a las leyes mercantiles de EE. UU.")
    ]
    
    for num, texto in clausulas:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(0.5)
        p.paragraph_format.line_spacing = 1.02
        
        r_num = p.add_run(f"{num}: ")
        r_num.font.name = "Arial"
        r_num.font.size = Pt(font_size_clause)
        r_num.font.bold = True
        r_num.font.color.rgb = RGBColor(11, 46, 89)
        
        r_txt = p.add_run(texto)
        r_txt.font.name = "Arial"
        r_txt.font.size = Pt(font_size_clause)
        r_txt.font.color.rgb = RGBColor(30, 41, 59)
        
    # SIGNATURE BLOCK WITH OFFICIAL SEAL EMBEDDED
    s_table = doc.add_table(rows=1, cols=2)
    s_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_table.autofit = False
    
    sc1, sc2 = s_table.rows[0].cells[0], s_table.rows[0].cells[1]
    sc1.width, sc2.width = Inches(3.75), Inches(3.75)
    set_cell_background(sc1, "F8FAFC")
    set_cell_background(sc2, "F8FAFC")
    set_cell_margins(sc1, 15, 15, 35, 35)
    set_cell_margins(sc2, 15, 15, 35, 35)
    
    # Broker side (WITH OFFICIAL STAMP/SEAL IMAGE)
    sp1 = sc1.paragraphs[0]
    sp1.paragraph_format.space_before = Pt(0)
    sp1.paragraph_format.space_after = Pt(0)
    sp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_blabel = sp1.add_run("POR EL BROKER AUTORIZADO (COPART PARTNER):\n")
    r_blabel.font.name = "Arial"
    r_blabel.font.size = Pt(7)
    r_blabel.font.bold = True
    r_blabel.font.color.rgb = RGBColor(11, 46, 89)
    
    # Embed realistic seal image
    if os.path.exists(SEAL_IMAGE_PATH):
        r_img = sp1.add_run()
        r_img.add_picture(SEAL_IMAGE_PATH, width=Inches(seal_width_inches))
    else:
        sp1.add_run("\n[SELLO OFICIAL AUTORIZADO]\n")
        
    p_bmeta = sc1.add_paragraph()
    p_bmeta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bmeta.paragraph_format.space_before = Pt(0)
    p_bmeta.paragraph_format.space_after = Pt(0)
    r_btext = p_bmeta.add_run("CERTIFICACIÓN DE REPRESENTACIÓN Y FIRMA DIGITAL")
    r_btext.font.name = "Arial"
    r_btext.font.size = Pt(6.5)
    r_btext.font.bold = True
    r_btext.font.color.rgb = RGBColor(11, 46, 89)
    
    # Client side
    sp2 = sc2.paragraphs[0]
    sp2.paragraph_format.space_before = Pt(0)
    sp2.paragraph_format.space_after = Pt(0)
    sp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_clabel = sp2.add_run("POR EL COMPRADOR (MANDANTE):\n\n")
    r_clabel.font.name = "Arial"
    r_clabel.font.size = Pt(7)
    r_clabel.font.bold = True
    r_clabel.font.color.rgb = RGBColor(11, 46, 89)
    
    sp2.add_run("\n___________________________________\n")
    
    p_cmeta = sc2.add_paragraph()
    p_cmeta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cmeta.paragraph_format.space_before = Pt(1)
    p_cmeta.paragraph_format.space_after = Pt(0)
    
    r_cname = p_cmeta.add_run(f"NOMBRE: {client_data['nombre_cliente']}\nID / DNI: {client_data['identificacion']}\nAceptado vía Confirmación WhatsApp / Telefónica")
    r_cname.font.name = "Arial"
    r_cname.font.size = Pt(7)
    r_cname.font.bold = True
    r_cname.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.save(filename)
    print(f"Generated DOCX: {filename}")

if __name__ == "__main__":
    gustavo_data = {
        "expediente": "EXP-2026-TX-67797166",
        "fecha": "21 de Noviembre de 2026",
        "nombre_cliente": "Gustavo Medal",
        "telefono": "Contacto Directo WhatsApp",
        "ubicacion": "Estados Unidos (USA)",
        "identificacion": "Registrado / Cliente Autorizado",
        "vehiculo": "2015 TOYOTA COROLLA LE SEDÁN (138,551 mi)",
        "lote": "67797166",
        "vin": "2T1BURHE5FC482910",
        "titulo": "TX - CLEAN TITLE (Título Limpio)",
        "presupuesto_tope": "$2,500 USD (Flexible con Autorización)",
        "honorarios": "$400 USD (Al recibir llaves en mano)"
    }
    
    edwin_data = {
        "expediente": "EXP-2026-TX-70498112",
        "fecha": "21 de Noviembre de 2026",
        "nombre_cliente": "Edwin Rivas",
        "telefono": "Contacto Directo WhatsApp",
        "ubicacion": "Texas (USA)",
        "identificacion": "Registrado / Cliente Autorizado",
        "vehiculo": "2025 TOYOTA SEQUOIA CAPSTONE HYBRID",
        "lote": "70498112",
        "vin": "5TDLEAB68SS009821",
        "titulo": "TX - CLEAN TITLE (Título Limpio)",
        "presupuesto_tope": "$15,000 USD (Flexible con Autorización)",
        "honorarios": "$400 USD (Al recibir llaves en mano)"
    }
    
    out_dir = r"d:\SUBASTAS"
    create_contract_docx(os.path.join(out_dir, "CONTRATO_GUSTAVO_MEDAL_COROLLA_2015.docx"), gustavo_data)
    create_contract_docx(os.path.join(out_dir, "CONTRATO_EDWIN_RIVAS_SEQUOIA_2025.docx"), edwin_data)
