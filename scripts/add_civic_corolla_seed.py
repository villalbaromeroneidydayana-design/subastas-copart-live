import os

with open('d:/SUBASTAS/src/services/seedData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

civic_images = [
    f"      {{ id: 'img-civic-{i}', vehicle_id: 'veh-civic-2022-72549566', url: '/vehicles/civic2022/72549566_Image_{i}.jpg', category: '{'exterior' if i in [1,2,3,4,5,6] else ('interior' if i in [7,8,11] else ('tablero' if i==9 else ('motor' if i==10 else 'exterior')))}', is_primary: {str(i==1).lower()}, order: {i}, caption: 'Foto oficial Copart #{i} - 2022 Honda Civic Touring' }}"
    for i in range(1, 14)
]
civic_images_str = ',\n'.join(civic_images)

corolla_images = [
    f"      {{ id: 'img-corolla21-{i}', vehicle_id: 'veh-corolla-2021-72119856', url: '/vehicles/corolla2021/72119856_Image_{i}.jpg', category: '{'exterior' if i in [1,2,3,4,5,6] else ('interior' if i in [7,8,11] else ('tablero' if i==9 else ('motor' if i==10 else 'exterior')))}', is_primary: {str(i==1).lower()}, order: {i}, caption: 'Foto oficial Copart #{i} - 2021 Toyota Corolla LE' }}"
    for i in range(1, 13)
]
corolla_images_str = ',\n'.join(corolla_images)

vehicles_block = f'''  {{
    id: 'veh-corolla-2021-72119856',
    brand: 'Toyota',
    model: 'Corolla LE',
    year: 2021,
    version: '1.8L 4-Cyl Dual VVT-i Sedan',
    vin: '5YFBPMBE4MP******',
    lot_number: '72119856',
    reference_url: 'https://www.copart.com/lot/72119856',
    engine: '1.8L 4-Cilindros DOHC 16V VVT-i (139 HP)',
    displacement: '1800 cc',
    transmission: 'Automática CVTi-S',
    drivetrain: 'FWD (Tracción Delantera)',
    fuel: 'Gasolina',
    odometer: 43956,
    odometer_unit: 'mi',
    exterior_color: 'Blanco (Super White)',
    interior_color: 'Gris Carbón',
    title_type: 'clean',
    vehicle_condition: 'run_and_drive',
    primary_damage: 'Desgaste Normal',
    secondary_damage: 'Ninguno',
    auction_reason: 'Liquidación Wholesale Copart Canada',
    sale_date: 'Miércoles, 25 de Noviembre de 2026 • 01:00 PM EST',
    has_keys: true,
    location: 'AB - Calgary / Wholesale Auction Canada',
    equipment: [
      'Toyota Safety Sense 2.0 con Frenado Autónomo',
      'Cámara de Reversa con Guías Dinámicas',
      'Pantalla Táctil de 8 pulgadas con Apple CarPlay y Android Auto',
      'Control de Crucero Dinámico por Radar',
      'Faros Delanteros Bi-LED con Encendido Automático',
      'Climatizador Automático'
    ],
    notes: 'LOTE REAL COPART #72119856. 2021 Toyota Corolla LE Blanco. Condición oficial RUN & DRIVE certificada por Copart (el motor arranca y la transmisión engrana). Título Limpio (Clean Title) libre de gravámenes. Bolsas de aire 100% INTACTAS de fábrica. Odómetro real de 70,741 km (43,956 millas). Llaves originales presentes.',
    est_retail_value: 19800,
    images: [
{corolla_images_str}
    ],
    custom_badges: {{
      runDriveText: 'RUN & DRIVE',
      titleTypeText: 'CLEAN TITLE (ACTIVE)',
      carfaxEnabled: true,
      carfaxText: 'Lote Verificado Oficial ✓',
      carfaxTitleStatus: 'Clean Title (Sin Gravámenes)',
      carfaxVerifiedNotes: 'Run & Drive garantizado. Bolsas de aire intactas de fábrica. Llaves incluidas.',
      carfaxOwners: '1 Solo Dueño Original',
      carfaxServiceRecords: 'Mantenimientos al Día',
      carfaxAccidents: 'Sin Daños Estructurales',
      extraBadges: []
    }},
    created_at: new Date('2026-11-21T20:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T20:00:00Z').toISOString(),
  }},
  {{
    id: 'veh-civic-2022-72549566',
    brand: 'Honda',
    model: 'Civic Touring',
    year: 2022,
    version: '1.5L Turbo 4-Cyl Touring Sedan Luxury',
    vin: '2HGFE1F96NH******',
    lot_number: '72549566',
    reference_url: 'https://www.copart.com/lot/72549566',
    engine_video_url: '/vehicles/civic2022/motor.mp4',
    engine: '1.5L DOHC 16-Valve VTEC Turbo 4-Cylinder (180 HP)',
    displacement: '1500 cc',
    transmission: 'Automática Deportiva CVT con Paletas al Volante',
    drivetrain: 'FWD (Tracción Delantera)',
    fuel: 'Gasolina',
    odometer: 87901,
    odometer_unit: 'mi',
    exterior_color: 'Plata Metalizado (Silver)',
    interior_color: 'Charcoal Premium Leather',
    title_type: 'clean',
    vehicle_condition: 'run_and_drive',
    primary_damage: 'Desgaste Normal',
    secondary_damage: 'Ninguno',
    auction_reason: 'Recuperación Financiera (Strike Acceptance Impounds)',
    sale_date: 'Martes, 24 de Noviembre de 2026 • 12:00 PM EST',
    has_keys: true,
    location: 'FL - Miami South (Wholesale Auction)',
    equipment: [
      'Versión TOURING (Nivel Máximo de Equipamiento Honda)',
      'Asientos de Piel Genuina con Calefacción y Ajuste Eléctrico',
      'Techo Corredizo Eléctrico One-Touch (Sunroof)',
      'Sistema de Audio Premium Bose con 12 Bocinas y Subwoofer',
      'Pantalla Táctil HD de 9 pulgadas con Apple CarPlay y Android Auto Inalámbrico',
      'Cargador Inalámbrico para Celular y Puertos USB-C',
      'Honda Sensing Suite (Control Crucero Adaptativo, Frenado Autónomo y Asistente de Carril)',
      'Rines de Aleación Deportivos de 18 pulgadas'
    ],
    notes: 'LOTE REAL COPART #72549566. 2022 Honda Civic Touring. Condición RUN & DRIVE oficial probada en carretera a más de 30 mph. Vendedor oficial Strike Acceptance Impounds (embargo bancario por cuotas, cero siniestro de choque). Título Limpio de Florida (FL - Certificate Of Title - Clean Title). Luz de venta verde con arbitraje de 21 días Copart. Bolsas de aire 100% INTACTAS de fábrica. Con llaves originales y video oficial de motor en funcionamiento.',
    est_retail_value: 22400,
    images: [
{civic_images_str}
    ],
    custom_badges: {{
      runDriveText: 'RUN & DRIVE (>30 MPH)',
      titleTypeText: 'FL - CLEAN TITLE',
      carfaxEnabled: true,
      carfaxText: 'Lote Verificado Oficial ✓',
      carfaxTitleStatus: 'FL - Clean Title (Strike Acceptance)',
      carfaxVerifiedNotes: 'Run & Drive comprobado en carretera. Video oficial de motor disponible. Bolsas de aire intactas.',
      carfaxOwners: '1 Solo Dueño (Recuperación Financiera)',
      carfaxServiceRecords: 'Inspección Multipunto Copart 3.9/5.0 - Luz Verde',
      carfaxAccidents: 'Sin Daños por Colisión (Recuperación Bancaria)',
      extraBadges: []
    }},
    created_at: new Date('2026-11-21T20:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T20:00:00Z').toISOString(),
  }}
'''

target_vehicles_end = '''    created_at: new Date('2026-11-21T12:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T12:00:00Z').toISOString(),
  }
];'''

if target_vehicles_end in text:
    replacement = '''    created_at: new Date('2026-11-21T12:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T12:00:00Z').toISOString(),
  },
''' + vehicles_block + '];'
    text = text.replace(target_vehicles_end, replacement)
    print('Vehicles added successfully!')
    with open('d:/SUBASTAS/src/services/seedData.ts', 'w', encoding='utf-8') as f:
        f.write(text)
else:
    print('target_vehicles_end not found!')
