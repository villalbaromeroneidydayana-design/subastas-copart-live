import sqlite3
import json

con = sqlite3.connect('data/auction.db')
cur = con.cursor()

vehicle_data = {
    "id": "veh-corolla-2021-72119856",
    "brand": "Toyota",
    "model": "Corolla LE",
    "year": 2021,
    "version": "1.8L 4-Cyl Automatic Sedan",
    "vin": "5YFBPMBE4MP482910",
    "lot_number": "72119856",
    "reference_url": "https://www.copart.com/lot/72119856",
    "engine": "1.8L 4-Cilindros DOHC 16V VVT-i",
    "displacement": "1.8L",
    "transmission": "Automática CVTi-S",
    "drivetrain": "FWD",
    "fuel": "Gasolina",
    "odometer": 43900,
    "odometer_unit": "mi",
    "exterior_color": "Blanco Perla",
    "interior_color": "Gris Carbón",
    "title_type": "clean",
    "vehicle_condition": "run_and_drive",
    "primary_damage": "Desgaste Normal",
    "secondary_damage": "Ninguno",
    "auction_reason": "Liquidación Mayorista Garantizada (Luz Verde Copart)",
    "sale_date": "Miércoles, 25 de Noviembre de 2026 • 01:00 PM EST",
    "has_keys": True,
    "location": "Calgary Wholesale / Patio Export",
    "equipment": [
        "Bolsas de Aire 100% Intactas de Fábrica",
        "Toyota Safety Sense 2.0 (Frenado Autónomo y Asistente de Carril)",
        "Pantalla Táctil Central con Apple CarPlay y Android Auto",
        "Cámara de Reversa de Alta Definición",
        "Faros Delanteros Bi-LED",
        "Aire Acondicionado Automático Climatronic",
        "Control de Crucero Adaptativo por Radar Dinámico",
        "Llaves Originales Incluidas"
    ],
    "notes": "LOTE REAL #72119856. Unidad 2021 Toyota Corolla LE en condición RUN & DRIVE oficial (arranca y camina verificado). Título Limpio (Clean Title). Bolsas de aire 100% intactas de fábrica. Solo 43,900 millas reales (70,741 km). Certificación de Luz Verde con política de arbitraje. Cero choques estructurales.",
    "est_retail_value": 15500,
    "images": [
        {"id": "img-cor21-1", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_1.jpg", "category": "exterior", "is_primary": True, "order": 1, "caption": "Vista 3/4 Delantera Izquierda - 2021 Toyota Corolla LE Blanco"},
        {"id": "img-cor21-2", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_2.jpg", "category": "exterior", "is_primary": False, "order": 2, "caption": "Perfil Delantero Derecho y Faros Bi-LED"},
        {"id": "img-cor21-3", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_3.jpg", "category": "exterior", "is_primary": False, "order": 3, "caption": "Costado Trasero Derecho y Línea de Carrocería"},
        {"id": "img-cor21-4", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_4.jpg", "category": "exterior", "is_primary": False, "order": 4, "caption": "Vista Posterior - Maletero y Ópticas Traseras"},
        {"id": "img-corolla21-5", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_5.jpg", "category": "exterior", "is_primary": False, "order": 5, "caption": "Frente Directo Impecable - Cero Choque"},
        {"id": "img-corolla21-6", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_6.jpg", "category": "exterior", "is_primary": False, "order": 6, "caption": "Vista Trasera Completa"},
        {"id": "img-corolla21-7", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_7.jpg", "category": "interior", "is_primary": False, "order": 7, "caption": "Cabina Interior - Bolsas de Aire 100% Intactas y Volante Original"},
        {"id": "img-corolla21-8", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_8.jpg", "category": "tablero", "is_primary": False, "order": 8, "caption": "Pantalla Central Multimedia y Climatizador"},
        {"id": "img-corolla21-9", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_9.jpg", "category": "tablero", "is_primary": False, "order": 9, "caption": "Cuadro de Instrumentos Digital - 70,741 km (43k mi)"},
        {"id": "img-corolla21-10", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_10.jpg", "category": "motor", "is_primary": False, "order": 10, "caption": "Vano Motor 1.8L VVT-i - Fluídos y Componentes Intactos"},
        {"id": "img-corolla21-11", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_11.jpg", "category": "interior", "is_primary": False, "order": 11, "caption": "Segunda Fila de Asientos en Tela Gris Impecable"},
        {"id": "img-corolla21-12", "vehicle_id": "veh-corolla-2021-72119856", "url": "/vehicles/corolla2021/72119856_Image_12.jpg", "category": "interior", "is_primary": False, "order": 12, "caption": "Placa VIN y Sellos de Fábrica"}
    ],
    "custom_badges": {
        "runDriveText": "RUN & DRIVE",
        "titleTypeText": "CLEAN TITLE VERIFIED",
        "carfaxEnabled": True,
        "carfaxText": "Luz Verde Copart ✓",
        "carfaxTitleStatus": "Active Clean Title (Título Limpio Garantizado)",
        "carfaxVerifiedNotes": "Run & Drive oficial. Bolsas de aire 100% intactas. 43,900 millas reales. Mecánica verificada.",
        "carfaxOwners": "1 Solo Dueño Original (43,900 mi)",
        "carfaxServiceRecords": "Mantenimientos Oficiales Registrados",
        "carfaxAccidents": "Bolsas de Aire Intactas / Cero Daño Estructural",
        "extraBadges": []
    },
    "created_at": "2026-11-21T23:00:00.000Z",
    "updated_at": "2026-11-21T23:00:00.000Z"
}

now = "2026-11-21T23:00:00.000Z"

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

con.commit()
print("2021 Toyota Corolla LE registered in SQLite vehicles_inventory successfully!")
