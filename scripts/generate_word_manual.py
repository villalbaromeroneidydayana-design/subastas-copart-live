import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import os

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = create_element('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=200, right=200):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = create_element('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = create_element(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_script_box(doc, title, script_text, note=""):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F0F4F8")
    set_cell_margins(cell, top=160, bottom=160, left=240, right=240)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"🎙️ {title.upper()}")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(10.5)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(11, 46, 89) # Navy
    
    p_text = cell.add_paragraph()
    p_text.paragraph_format.space_before = Pt(2)
    p_text.paragraph_format.space_after = Pt(4)
    p_text.paragraph_format.line_spacing = 1.15
    run_text = p_text.add_run(f'"{script_text}"')
    run_text.font.name = "Georgia"
    run_text.font.size = Pt(10.5)
    run_text.font.italic = True
    run_text.font.color.rgb = RGBColor(30, 41, 59)
    
    if note:
        p_note = cell.add_paragraph()
        p_note.paragraph_format.space_before = Pt(4)
        p_note.paragraph_format.space_after = Pt(0)
        run_note = p_note.add_run(f"📌 {note}")
        run_note.font.name = "Arial"
        run_note.font.size = Pt(9)
        run_note.font.bold = True
        run_note.font.color.rgb = RGBColor(100, 116, 139)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def generate_word_manual():
    doc = docx.Document()
    
    # Page setup - Standard Letter, 0.75 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
    # Styles
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_main = title_p.add_run("MANUAL OPERATIVO DEL BROKER DE SUBASTAS")
    r_main.font.name = "Arial Black"
    r_main.font.size = Pt(18)
    r_main.font.color.rgb = RGBColor(11, 46, 89) # Copart Blue
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = sub_p.add_run("Protocolo Oficial de Ventas y Negociación por WhatsApp y Subasta en Vivo\nGuion Exacto Paso a Paso — Método 'Generar Dinero Haciendo Caso'")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(10)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)
    
    # REGLAS DE ORO
    p_reglas = doc.add_paragraph()
    p_reglas.paragraph_format.space_before = Pt(8)
    p_reglas.paragraph_format.space_after = Pt(4)
    r = p_reglas.add_run("⚡ LAS 4 REGLAS DE ORO INQUEBRANTABLES")
    r.font.name = "Arial"
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor(185, 28, 28) # Red
    
    table_rules = doc.add_table(rows=4, cols=2)
    table_rules.alignment = WD_TABLE_ALIGNMENT.CENTER
    rules_data = [
        ("1. NUNCA COBRAR POR ADELANTADO", "La comisión del broker ($300 a $500 USD) se cobra ÚNICA Y EXCLUSIVAMENTE cuando el cliente tiene las llaves y el vehículo físico en sus manos. Esto elimina cualquier desconfianza o sospecha de estafa."),
        ("2. GARANTÍA DE RIESGO CERO ($0)", "Si la subasta se pierde o el lote supera el presupuesto acordado, el cliente NO paga ni un solo centavo ($0 USD). Se vuelve al Paso 3 a buscar otro lote sin penalizaciones."),
        ("3. TONO SOBRIO Y PROFESIONAL", "Jamás utilizar frases desesperadas como 'fotos 100% reales', 'sin mentiras' o 'transparencia total'. El broker habla con datos técnicos, autoridad y calma ejecutiva."),
        ("4. RESPETO ESTRICTO DEL FLUJO", "No enviar contratos antes de que elija carro (Paso 4). No enviar enlaces de subasta antes de que acepte las reglas y firme la representación (Paso 6).")
    ]
    for idx, (col1, col2) in enumerate(rules_data):
        row = table_rules.rows[idx]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width, c2.width = Inches(2.2), Inches(4.3)
        set_cell_background(c1, "F8FAFC")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(col1)
        r1.font.name = "Arial"
        r1.font.size = Pt(9)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        
        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(col2)
        r2.font.name = "Arial"
        r2.font.size = Pt(9)
        r2.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # SECCIÓN PASO 1 Y 2
    p_sec1 = doc.add_paragraph()
    r = p_sec1.add_run("PASO 1 Y 2: CONTACTO INICIAL Y CALIFICACIÓN")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    add_script_box(
        doc,
        "Guion de Calificación Inicial (WhatsApp / Teléfono)",
        "Don Gustavo, buenas tardes, gusto en saludarlo. Habla [Tu Nombre], broker de subastas de Copart. Vi que tiene interés en conseguir un vehículo. Cuénteme con confianza: ¿Qué modelo exacto tiene en mente, en qué estado se encuentra ubicado y con qué presupuesto total contamos para buscarle las mejores opciones en patio?",
        "Objetivo: Extraer Modelo deseado, Estado de residencia y Presupuesto límite (Ej: Toyota Corolla, USA, $2,500 USD)."
    )
    
    # SECCIÓN PASO 3
    p_sec3 = doc.add_paragraph()
    r = p_sec3.add_run("PASO 3: PRESENTACIÓN DE VEHÍCULOS (UNA OPCIÓN A LA VEZ)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    doc.add_paragraph("Regla: Se envían fotos limpias, ficha técnica y un rango de puja calculado siempre por debajo de su presupuesto máximo. Nunca enviar carros destruidos o para chatarra; deben verse completos, Run & Drive y presentables.").paragraph_format.space_after = Pt(4)
    
    add_script_box(
        doc,
        "Guion Nota de Voz - Presentación Opción Vehículo (25 a 30 seg)",
        "Don Gustavo, le acabo de mandar esta opción al chat. Es un Toyota Corolla LE 2015, color negro. El carro estéticamente está muy bien parado: viene con rines deportivos, quemacocos y carrocería derecha, catalogado en subasta únicamente con desgaste normal y detalles menores de uso. Mecánicamente ya está verificado por Copart: arranca, la transmisión engrana y camina sin problema. Con este carro podemos entrar a la puja entre los $1,700 y los $2,100 dólares, quedándole perfecto dentro de sus $2,500. Échele un vistazo a las fotos y me dice qué le parece.",
        "Acción: Esperar a que el cliente confirme que le gusta ese vehículo."
    )
    
    # SECCIÓN PASO 4
    p_sec4 = doc.add_paragraph()
    r = p_sec4.add_run("PASO 4: LA PREGUNTA DE TRANSICIÓN OBLIGATORIA (FILTRO ESTRATÉGICO)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    doc.add_paragraph("Regla: NUNCA explicar el proceso de golpe. Se hace la pregunta de alternativa forzada. Cualquier respuesta que dé el cliente es un SÍ a continuar.").paragraph_format.space_after = Pt(4)
    
    add_script_box(
        doc,
        "Mensaje de Texto - Transición de Cierre (Copiar y Pegar)",
        "Don Gustavo, ha elegido una excelente opción. Ese Corolla 2015 está impecable y tiene las mejores condiciones para sacarlo dentro de su presupuesto.\n\nPara coordinar los detalles de la subasta, cómo blindamos su presupuesto para no pasarnos de los $2,500 y cómo lo representamos legalmente:\n\n¿Prefiere que le pegue una llamada corta de 3 minutos o le queda más cómodo que se lo explique por aquí mediante notas de voz?",
        "Si responde 'Por llamada' -> Ir al Guion Telefónico. Si responde 'Por notas de voz' -> Enviar Audios 1, 2 y 3."
    )
    
    # SECCIÓN PASO 5: LOS 3 AUDIOS DETALLADOS
    p_sec5 = doc.add_paragraph()
    r = p_sec5.add_run("PASO 5: EXPLICACIÓN DEL PROCESO — LOS 3 AUDIOS DETALLADOS")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    doc.add_paragraph("Enviar en 3 audios separados (30 a 40 segundos cada uno). Escuchar un audio tras otro genera una retención del 100% y cero fricción.").paragraph_format.space_after = Pt(6)
    
    # AUDIO 1
    add_script_box(
        doc,
        "AUDIO 1: El Tope y Blindaje del Presupuesto (Duración: 35 seg)",
        "Don Gustavo, le explico el primer punto que es el más importante: el presupuesto.\n\nUsted me indicó que su presupuesto máximo son $2,500 dólares. Nosotros entramos a la subasta en vivo con nuestra licencia oficial de broker y arrancamos la puja desde abajo, sobre los $700 dólares. Vamos a ir peleando el lote poco a poco, pero con un compromiso total: bajo ninguna circunstancia nos vamos a pasar de sus $2,500.\n\nSi la subasta se puede ganar en $1,800, $1,900 o $2,100, ahí la cerramos y todo ese ahorro le queda directamente a usted en su bolsillo.",
        "Gatillo mental: Control del dinero y ahorro garantizado."
    )
    
    # AUDIO 2
    add_script_box(
        doc,
        "AUDIO 2: La Garantía de Riesgo Cero — $0 Dólares si se Pierde (Duración: 30 seg)",
        "Don Gustavo, el segundo punto es la tranquilidad total suya: la garantía de riesgo cero.\n\n¿Qué pasa si en la subasta entra algún comprador agresivo y la puja supera los $2,500 dólares? Simplemente soltamos el carro, no nos pasamos de su dinero y usted no tiene que pagar absolutamente nada, CERO dólares. No hay cobros ocultos ni penalizaciones.\n\nEn ese caso, simplemente volvemos al catálogo y le busco otra opción igual de buena hasta ganarle su carro dentro de su valor.",
        "Gatillo mental: Cero riesgo financiero. El cliente no tiene nada que perder."
    )
    
    # AUDIO 3
    add_script_box(
        doc,
        "AUDIO 3: Los Honorarios del Broker al Tener las Llaves en Mano (Duración: 35 seg)",
        "Y el tercer punto, Don Gustavo, es sobre nuestros honorarios como broker.\n\nNuestra comisión por representarlo, gestionar la subasta y tramitar el título del vehículo son $400 dólares. Pero escúcheme bien esto: nosotros NO le cobramos esa comisión por adelantado. Esos $400 dólares usted nos los paga ÚNICA Y EXCLUSIVAMENTE cuando la subasta ya esté ganada, los papeles listos y usted tenga el vehículo físico y las llaves en sus manos.\n\nAsí usted tiene la total seguridad de que nuestro interés es que usted reciba su carro en perfectas condiciones.",
        "Gatillo mental: Certeza absoluta. El broker solo cobra por éxito demostrado."
    )
    
    # GUION ALTERNATIVO SI ELIGE LLAMADA
    add_script_box(
        doc,
        "GUION ALTERNATIVO: Si Don Gustavo Elige Llamada Telefónica (2 Minutos)",
        "Hola Don Gustavo, buenas tardes, qué gusto saludarlo. Mire, lo llamo rápido para que le quede clarísimo el proceso de cómo vamos a ganar ese Corolla 2015.\n\nSon 3 puntos sencillos:\nPrimero: Su tope son $2,500 dólares. Nosotros arrancamos la subasta desde $700 y la idea es ganarlo entre los $1,800 y $2,100. Jamás nos pasamos de su tope.\nSegundo: Si la subasta se sube de su presupuesto, soltamos el lote y usted paga CERO dólares, riesgo completamente cero.\nY tercero: Nuestra comisión son $400 dólares, pero usted no me paga ni un centavo ahorita. Me los paga únicamente cuando tenga el carro y las llaves en su mano.\n\n¿Le parece bien que le prepare el documento de representación para tener todo blindado y entrar a la subasta?",
        "Cierre de llamada: Conseguir el 'Sí, mándemelo'."
    )
    
    # SECCIÓN PASO 6
    p_sec6 = doc.add_paragraph()
    r = p_sec6.add_run("PASO 6: ENVÍO DEL CONTRATO DE REPRESENTACIÓN (BROKERAGE AGREEMENT)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    add_script_box(
        doc,
        "Mensaje de Acompañamiento del Contrato (WhatsApp)",
        "Don Gustavo, aquí le adjunto su documento de autorización y representación oficial. Ahí queda estipulado por escrito que su oferta máxima autorizada son $2,500 dólares para el Toyota Corolla LE 2015 Lote #67797166, que el vehículo cuenta con Título Limpio y verificación Run & Drive, y que nuestros honorarios se cancelan únicamente al recibir usted el vehículo.\n\nFírmelo o confírmelo con su nombre completo por aquí para que el sistema nos habilite la paleta oficial en la subasta.",
        "Acción: El cliente confirma o firma."
    )
    
    # SECCIÓN PASO 7
    p_sec7 = doc.add_paragraph()
    r = p_sec7.add_run("PASO 7: ENLACE A LA SALA DE SUBASTA EN VIVO (COPART VB3)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    add_script_box(
        doc,
        "Mensaje para Entrar a la Sala de Subasta",
        "Don Gustavo, ya estamos autorizados en el sistema. Ingrese a este enlace oficial de Copart desde su celular para que siga la subasta en vivo de su vehículo:\n\n👉 [Enlace de la Sala Cliente]\n\nUsted verá el lote #67797166 en pantalla. Nosotros estaremos pujando en tiempo real con la Paleta #101 para asegurar el carro dentro de su número. ¡Manténgase conectado!",
        "El cliente ve las fotos, el reloj y cómo la Paleta #101 defiende el lote."
    )
    
    # SECCIÓN PASO 8: ADJUDICACIÓN Y ENTREGA DE LLAVES
    p_sec8 = doc.add_paragraph()
    r = p_sec8.add_run("PASO 8: POST-SUBASTA — GUIONES AL GANAR Y AL ENTREGAR LLAVES")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(11, 46, 89)
    
    # GUION AL GANAR
    add_script_box(
        doc,
        "GUION 1: Cuando se Gana la Subasta (Inmediatamente tras adjudicarse)",
        "¡Don Gustavo, felicidades! ¡Lo ganamos! Se lo cerramos en $1,950 dólares con la Paleta #101. Le ahorramos más de $500 dólares de lo que usted tenía presupuestado.\n\nEn este momento Copart nos emite la factura oficial del lote adjudicado. El pago del vehículo se realiza mediante transferencia bancaria directa a las cuentas oficiales de la subasta para la liberación del título limpio a su nombre y la orden de retiro del patio.",
        "Paso siguiente: Coordinación del pago directo del carro a Copart y logística de transporte/grúa."
    )
    
    # GUION CUANDO TIENE LAS LLAVES
    add_script_box(
        doc,
        "GUION 2: Cuando el Vehículo es Entregado y Tiene las Llaves en Mano (COBRO DE COMISIÓN)",
        "Don Gustavo, qué satisfacción tan grande. El transportista me confirma que el Toyota Corolla ya está en su dirección con sus llaves originales, su título limpio y la documentación en orden.\n\nVerifíquelo con calma, enciéndalo y revise que todo esté tal como se lo mostramos en la subasta.\n\nComo le prometí desde el primer día: nosotros cumplimos con nuestra palabra. Ahora sí, ya que usted tiene su vehículo y sus llaves en mano, procedemos con la liquidación de nuestros honorarios de broker de $400 dólares. Le comparto los datos de Zelle / transferencia por aquí. Muchísimas gracias por su confianza y bienvenido a la familia de clientes satisfechos.",
        "Efecto: Cumplimiento impecable. Cero fricción para cobrar los $400 USD. Momento ideal para pedirle un video de 15 segundos recomendando el servicio."
    )
    
    # GUION SI SE PIERDE
    add_script_box(
        doc,
        "GUION DE CONTINGENCIA: Si la Subasta se Pierde (Superó los $2,500)",
        "Don Gustavo, como escuchó en vivo, un postor externo subió la puja a $2,650. Como le prometí bajo palabra y contrato, nosotros somos responsables y no arriesgamos su dinero, así que soltamos el carro.\n\nUsted no debe pagar absolutamente nada por esta subasta, cero dólares. Ya tengo filtrado otro Corolla en excelentes condiciones en el patio vecino. En 10 minutos le envío la foto para ir por ese con la misma estrategia.",
        "Efecto: El cliente ve que el broker cuida su dinero de verdad y la confianza se multiplica por diez."
    )
    
    output_path = r"d:\SUBASTAS\MANUAL_OFICIAL_BROKER_VENTAS_COPART.docx"
    doc.save(output_path)
    print(f"Documento Word guardado exitosamente en: {output_path}")

if __name__ == "__main__":
    generate_word_manual()
