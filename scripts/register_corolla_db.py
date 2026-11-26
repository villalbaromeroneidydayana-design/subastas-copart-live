import sqlite3
import json
import os

con = sqlite3.connect('data/auction.db')
cur = con.cursor()

# 1. Vehicle data JSON
vehicle_data = {
    "id": "veh-corolla-2015-67797166",
    "brand": "Toyota",
    "model": "Corolla LE",
    "year": 2015,
    "version": "1.8L 4-Cyl Automatic Sedan",
    "vin": "2T1BURHE5FC482910",
    "lot_number": "67797166",
    "reference_url": "https://www.copart.com/lot/67797166",
    "engine": "1.8L 4-Cilindros DOHC 16V VVT-i",
    "displacement": "1.8L",
    "transmission": "Automática CVTi-S",
    "drivetrain": "FWD",
    "fuel": "Gasolina",
    "odometer": 138551,
    "odometer_unit": "mi",
    "exterior_color": "Negro",
    "interior_color": "Gris Carbón",
    "title_type": "clean",
    "vehicle_condition": "run_and_drive",
    "primary_damage": "Desgaste Normal",
    "secondary_damage": "Abolladuras/Arañazos Menores",
    "auction_reason": "Liquidación de Inventario Certificado",
    "sale_date": "Viernes, 27 de Noviembre de 2026 • 01:00 PM EST",
    "has_keys": True,
    "location": "Houston (TX)",
    "equipment": [
        "Quemacocos / Sunroof Eléctrico",
        "Rines Deportivos de Aleación en Negro",
        "Sistema de Pantalla Táctil con Cámara de Reversa",
        "Aire Acondicionado Automático",
        "Control Crucero y Controles al Volante",
        "Frenos ABS y Control de Estabilidad VSC",
        "Transmisión Automática Secuencial",
        "Llave Original Incluida"
    ],
    "notes": "Vehículo verificado Run and Drive por Copart. Motor arranca con suavidad y transmisión engrana en todos los cambios. Carrocería completa sin deformaciones estructurales. Título Limpio oficial de Texas listo para documentación, registro y traspaso inmediato.",
    "est_retail_value": 9850,
    "images": [
        {"id": "img-corolla-1", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_1.jpg", "category": "exterior", "is_primary": True, "order": 1, "caption": "Vista 3/4 Delantera Izquierda - 2015 Toyota Corolla LE"},
        {"id": "img-corolla-2", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_2.jpg", "category": "exterior", "is_primary": False, "order": 2, "caption": "Perfil Delantero Derecho y Rines Deportivos"},
        {"id": "img-corolla-3", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_3.jpg", "category": "exterior", "is_primary": False, "order": 3, "caption": "Costado Trasero Derecho y Línea de Carrocería"},
        {"id": "img-corolla-4", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_4.jpg", "category": "exterior", "is_primary": False, "order": 4, "caption": "Vista Trasera Completa - Emblemas y Maletero"},
        {"id": "img-corolla-5", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_5.jpg", "category": "exterior", "is_primary": False, "order": 5, "caption": "Perspectiva Lateral Izquierda y Quemacocos"},
        {"id": "img-corolla-6", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_6.jpg", "category": "exterior", "is_primary": False, "order": 6, "caption": "Frente Directo - Ópticas, Parrilla y Bumper Intactos"},
        {"id": "img-corolla-7", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_7.jpg", "category": "exterior", "is_primary": False, "order": 7, "caption": "Vista de Techo y Sunroof Abierto"},
        {"id": "img-corolla-8", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_8.jpg", "category": "interior", "is_primary": False, "order": 8, "caption": "Cabina Principal - Tapicería, Volante y Consola"},
        {"id": "img-corolla-9", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_9.jpg", "category": "tablero", "is_primary": False, "order": 9, "caption": "Cuadro de Instrumentos - 138,551 mi Sin Testigos Críticos"},
        {"id": "img-corolla-10", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_10.jpg", "category": "mecanica", "is_primary": False, "order": 10, "caption": "Bahía de Motor 1.8L VVT-i - Fluídos y Componentes Completos"},
        {"id": "img-corolla-11", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_11.jpg", "category": "interior", "is_primary": False, "order": 11, "caption": "Asientos Traseros y Espacio Interior Impecable"},
        {"id": "img-corolla-12", "vehicle_id": "veh-corolla-2015-67797166", "url": "/vehicles/corolla2015/67797166_Image_12.jpg", "category": "otros", "is_primary": False, "order": 12, "caption": "Placa de Identificación VIN y Verificación de Puerta"}
    ],
    "custom_badges": {
        "runDriveText": "RUN & DRIVE",
        "titleTypeText": "TX - CLEAN TITLE",
        "carfaxEnabled": True,
        "carfaxText": "Lote Verificado Oficial ✓",
        "carfaxTitleStatus": "Texas Clean Title (Documentación Lista para Traspaso)",
        "carfaxVerifiedNotes": "Run & Drive certificado por Copart. Llaves incluidas. Cero colisiones graves. Título limpio listo para documentación y registro vehicular.",
        "carfaxOwners": "Historial Registrado y Verificado",
        "carfaxServiceRecords": "Mantenimientos al Día",
        "carfaxAccidents": "Sin Daños Estructurales (Solo Desgaste Normal)",
        "extraBadges": []
    },
    "created_at": "2026-11-21T12:00:00.000Z",
    "updated_at": "2026-11-21T12:00:00.000Z"
}

now = "2026-11-21T12:00:00.000Z"

# Insert/Update vehicles_inventory
cur.execute("""
INSERT INTO vehicles_inventory (id, lot_number, vin, brand, model, year, data_json, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(lot_number) DO UPDATE SET
  vin = excluded.vin,
  brand = excluded.brand,
  model = excluded.model,
  year = excluded.year,
  data_json = excluded.data_json,
  updated_at = excluded.updated_at
""", (
    vehicle_data["id"],
    vehicle_data["lot_number"],
    vehicle_data["vin"],
    vehicle_data["brand"],
    vehicle_data["model"],
    vehicle_data["year"],
    json.dumps(vehicle_data, ensure_ascii=False),
    now,
    now
))

# Insert/Update auction_sessions
cur.execute("""
INSERT INTO auction_sessions (
  id, title, lot_number, brand, model, year, status, starting_price, min_increment, reserve_price,
  current_price, client_max_budget, bid_count, time_remaining_seconds, total_duration_seconds,
  room_token, is_token_revoked, vehicle_json, broker_access_token, buyer_access_token,
  broker_name, buyer_name, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  lot_number = excluded.lot_number,
  brand = excluded.brand,
  model = excluded.model,
  year = excluded.year,
  status = excluded.status,
  starting_price = excluded.starting_price,
  min_increment = excluded.min_increment,
  reserve_price = excluded.reserve_price,
  current_price = excluded.current_price,
  client_max_budget = excluded.client_max_budget,
  vehicle_json = excluded.vehicle_json,
  broker_name = excluded.broker_name,
  buyer_name = excluded.buyer_name,
  updated_at = excluded.updated_at
""", (
    "ses-live-corolla",
    "Subasta Oficial en Vivo - 2015 Toyota Corolla LE",
    "67797166",
    "Toyota",
    "Corolla LE",
    2015,
    "prepared",
    700,
    50,
    1800,
    700,
    2500,
    0,
    45,
    45,
    "copart-live-gustavo",
    0,
    json.dumps(vehicle_data, ensure_ascii=False),
    "bdr_broker_gustavo",
    "bdr_buyer_gustavo",
    "Broker Autorizado (Representante)",
    "Gustavo Medal (Comprador)",
    now,
    now
))

# Register participant paddle #101 for broker in this session
import hashlib
broker_token_hash = hashlib.sha256(b"bdr_broker_gustavo").hexdigest()
cur.execute("""
INSERT INTO auction_participants (
  id, session_id, name, paddle_number, location, token_hash, authorization_status, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(session_id, paddle_number) DO UPDATE SET
  token_hash = excluded.token_hash
""", (
    "part-corolla-broker",
    "ses-live-corolla",
    "Broker Autorizado (Representante)",
    "Paleta #101",
    "USA",
    broker_token_hash,
    "approved",
    now
))

con.commit()
print("Corolla vehicle and session registered in SQLite successfully!")
