import fitz
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak

pdf_path = r'C:\Users\ALP\.gemini\antigravity\brain\0d1ff2e6-2163-4b55-a715-f7244a37bb54\CONTRATO_JOHAN_VLADIMIR_CAMRY_2022.pdf'
pdf_public = r'd:\SUBASTAS\CONTRATO_JOHAN_VLADIMIR_CAMRY_2022.pdf'

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    rightMargin=40,
    leftMargin=40,
    topMargin=36,
    bottomMargin=36
)

header_title = ParagraphStyle(
    'HeaderTitle',
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=24,
    textColor=colors.HexColor('#1E3A8A'),
    alignment=1
)

header_sub = ParagraphStyle(
    'HeaderSub',
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#D97706'),
    alignment=1
)

doc_title = ParagraphStyle(
    'DocTitle',
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=16,
    textColor=colors.HexColor('#1F2937'),
    alignment=1
)

label_style = ParagraphStyle(
    'Label',
    fontName='Helvetica-Bold',
    fontSize=9.5,
    leading=13,
    textColor=colors.HexColor('#1E3A8A')
)

val_style = ParagraphStyle(
    'Val',
    fontName='Helvetica',
    fontSize=9.5,
    leading=13,
    textColor=colors.HexColor('#111827')
)

section_hdr = ParagraphStyle(
    'SectionHdr',
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#1E3A8A')
)

clause_body = ParagraphStyle(
    'ClauseBody',
    fontName='Helvetica',
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor('#374151')
)

story = []

# Header
story.append(Paragraph('PUJAMOTOR AUTOS USA', header_title))
story.append(Paragraph('SERVICIOS DE BROKERAGE Y REPRESENTACION EN SUBASTAS AUTOMOTRICES', header_sub))
story.append(Spacer(1, 4))
story.append(Paragraph('CONTRATO DE MANDATO, CORRETAJE Y GESTION DE ADQUISICION VEHICULAR', doc_title))
story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#1E3A8A'), spaceBefore=4, spaceAfter=8))

# Meta bar
meta_data = [
    [
        Paragraph('<b>FOLIO OFICIAL:</b> PMA-CA-2026-76061096', label_style),
        Paragraph('<b>PALETA OFICIAL:</b> POSTOR #101', label_style),
        Paragraph('<b>FECHA:</b> 25 de Noviembre de 2026', label_style)
    ]
]
t_meta = Table(meta_data, colWidths=[200, 160, 172])
t_meta.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
]))
story.append(t_meta)
story.append(Spacer(1, 10))

# Parties table
story.append(Paragraph('I. PARTES CONTRATANTES', section_hdr))
story.append(Spacer(1, 4))
client_info = [
    [Paragraph('<b>BROKER / MANDATARIO:</b>', label_style), Paragraph('<b>PUJAMOTOR AUTOS USA</b> (Division de Operaciones y Corretaje Automotriz)', val_style)],
    [Paragraph('<b>CLIENTE / MANDANTE:</b>', label_style), Paragraph('<b>JOHAN VLADIMIR RAJO ARIAS</b>', val_style)],
    [Paragraph('<b>IDENTIFICACION OFICIAL:</b>', label_style), Paragraph('California Driver License: <b>DL W1947766</b><br/>(Exp: 06/12/2028 | DOB: 06/12/1978)', val_style)],
    [Paragraph('<b>DIRECCION ACTUAL DE ENTREGA:</b>', label_style), Paragraph('<b>1800 W Gramercy Ave Apt #54, Anaheim, CA 92801</b>', val_style)],
    [Paragraph('<b>TELEFONOS REGISTRADOS:</b>', label_style), Paragraph('Principal: <b>+1 (714) 272-1351</b><br/>Hijos / Contactos: <b>(714) 883-6837</b> / <b>(714) 415-9795</b>', val_style)],
]
t_client = Table(client_info, colWidths=[175, 357])
t_client.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F3F4F6')),
]))
story.append(t_client)
story.append(Spacer(1, 10))

# Vehicle & Parameters
story.append(Paragraph('II. VEHICULO SELECCIONADO Y PARAMETROS ECONOMICOS', section_hdr))
story.append(Spacer(1, 4))
veh_info = [
    [Paragraph('<b>VEHICULO ADJUDICABLE:</b>', label_style), Paragraph('<b>2022 TOYOTA CAMRY SE (SPORT EDITION)</b>', val_style)],
    [Paragraph('<b>NUMERO DE LOTE:</b>', label_style), Paragraph('<b>#76061096</b> | Procedencia: <b>TOYOTA FINANCIAL (Agencia)</b>', val_style)],
    [Paragraph('<b>VIN / NUMERO DE SERIE:</b>', label_style), Paragraph('4T1T11AK8NU****** | Color: <b>Gris Metalico Deportivo</b>', val_style)],
    [Paragraph('<b>TITULO Y CONDICION:</b>', label_style), Paragraph('<b>Clean Title (Titulo Limpio de California)</b> | <b>Green Light</b>', val_style)],
    [Paragraph('<b>MOTOR Y TRANSMISION:</b>', label_style), Paragraph('<b>2.5L 4 Cilindros (Ahorrador)</b> | <b>Automatica 8 Velocidades</b>', val_style)],
    [Paragraph('<b>ODOMETRO Y ESTADO:</b>', label_style), Paragraph('99,960 millas reales | <b>Cero Choques (Normal Wear)</b> | Llaves: SI', val_style)],
    [Paragraph('<b>INTERIOR Y EQUIPO:</b>', label_style), Paragraph('<b>Asientos deportivos en Piel / Cuerina SofTex</b> | Rines 18" SE | Pantalla', val_style)],
    [Paragraph('<b>UBICACION Y ENTREGA:</b>', label_style), Paragraph('Patio Van Nuys, CA (Flete local directo a <b>Anaheim, CA 92801</b>)', val_style)],
    [Paragraph('<b>PRESUPUESTO AUTORIZADO:</b>', label_style), Paragraph('<b>$5,000.00 a $7,500.00 USD</b> (Tope maximo convenido)', val_style)],
    [Paragraph('<b>FECHA DE SALA EN VIVO:</b>', label_style), Paragraph('<b>Hoy Miercoles, 25 de Noviembre de 2026 • 08:30 PM PST</b>', val_style)],
]
t_veh = Table(veh_info, colWidths=[175, 357])
t_veh.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#BFDBFE')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DBEAFE')),
]))
story.append(t_veh)

# Page break to Page 2 for Clauses and Signatures
story.append(PageBreak())

# Page 2
story.append(Paragraph('III. TERMINOS Y CONDICIONES DEL SERVICIO', section_hdr))
story.append(Spacer(1, 6))

clauses = [
    ('PRIMERA. MANDATO DE REPRESENTACION EN SALA:',
     'PUJAMOTOR AUTOS USA habilita su licencia comercial y paleta de postor #101 para representar y pujar en tiempo real a nombre del CLIENTE por el 2022 Toyota Camry SE. PUJAMOTOR AUTOS USA se compromete estrictamente a no sobrepasar el techo presupuestario autorizado ($7,500.00 USD), buscando la adjudicacion en el rango mas bajo posible para maximizar el margen de ahorro del comprador.'),
    ('SEGUNDA. HONORARIOS DE CORRETAJE CONTRA EXITO:',
     'Los honorarios de corretaje de PUJAMOTOR AUTOS USA se causan UNICAMENTE si el vehiculo es ganado y adjudicado dentro del presupuesto pactado. Si la puja supera el limite autorizado y la unidad no es adjudicada, no se generara cobro alguno de honorarios de broker.'),
    ('TERCERA. POLIZA DE RESPALDO Y VERIFICACION MECANICA:',
     'PUJAMOTOR AUTOS USA certifica que el lote cuenta con certificacion Green Light (prueba de manejo en pista a mas de 30 mph) y procedencia directa de Toyota Financial. El presente contrato ampara una poliza de verificacion mecanica: ante cualquier anomalia de motor o transmision no notificada previamente, se garantiza la inspeccion y diagnostico por un mecanico calificado.'),
    ('CUARTA. PERMISO PROVISIONAL Y PLACA TEMPORAL DE 30 DIAS:',
     'El vehiculo se entregara con un permiso provisional de transito y placa temporal oficial de 30 dias, facultando al CLIENTE a circular de manera 100% legal e inmediata en California mientras concluye la emision del registro y placas definitivas.'),
    ('QUINTA. TITULACION DIRECTA AL CLIENTE:',
     'El traspaso de titulo, factura oficial y documentacion del vehiculo se expediran formalmente a nombre de JOHAN VLADIMIR RAJO ARIAS con respaldo de su licencia de California DL W1947766 (o de la persona que el designe de forma expresa).'),
    ('SEXTA. LOGISTICA DE TRASLADO Y ENTREGA DIRECTA EN ANAHEIM:',
     'El traslado se coordinara mediante servicio de grua plataforma certificada directamente desde el patio de Van Nuys, CA hasta el domicilio actual del CLIENTE en 1800 W Gramercy Ave Apt #54, Anaheim, CA 92801, previa confirmacion de horario.'),
]

for title, body in clauses:
    story.append(Paragraph(f'<b>{title}</b> {body}', clause_body))
    story.append(Spacer(1, 6))

story.append(Spacer(1, 16))

# Signatures
sig_data = [
    [
        Paragraph('<b>POR PUJAMOTOR AUTOS USA</b><br/><br/><br/><br/>________________________________________<br/><b>DEPARTAMENTO DE OPERACIONES Y CORRETAJE</b><br/>Licencia de Broker Automotriz Autorizado<br/>Pujamotor Autos USA', clause_body),
        Paragraph('<b>POR EL CLIENTE / MANDANTE</b><br/><br/><br/><br/>________________________________________<br/><b>JOHAN VLADIMIR RAJO ARIAS</b><br/>California Driver License: DL W1947766<br/>Aceptacion y Mandato de Subasta', clause_body)
    ]
]
t_sig = Table(sig_data, colWidths=[266, 266])
t_sig.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
]))
story.append(t_sig)

doc.build(story)

import shutil
shutil.copyfile(pdf_path, pdf_public)

doc_check = fitz.open(pdf_public)
print('Total paginas Camry:', len(doc_check))
print('Contrato Camry generado con exito en:', pdf_public)
