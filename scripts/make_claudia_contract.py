import sys
sys.path.append(r"d:\SUBASTAS\scripts")
from generar_contrato_cliente import create_client_contract

client_data = {
    'nombre_cliente': 'Claudia Elena Villalobos',
    'telefono': '757-349-5077',
    'ubicacion': '108 Lyttle Dr, Newport News, VA 23606',
    'identificacion': 'Claudia@cnfei.com',
    'vehiculo': '2015 Toyota Corolla LE Sedan',
    'lote': '67797166',
    'vin': '2T1BURHE5FC482910',
    'titulo': 'TX - CLEAN TITLE (Título Limpio)',
    'presupuesto_tope': '$1,500 USD (Flexible con Autorización)',
    'honorarios': '$400 USD (Al recibir llaves en mano)',
    'fecha': '23 de Noviembre de 2026',
    'expediente': 'EXP-2026-COPART-VA-092'
}

docx_path, pdf_path = create_client_contract(client_data, convert_pdf=True)
print("SUCCESS:")
print("DOCX:", docx_path)
print("PDF:", pdf_path)
