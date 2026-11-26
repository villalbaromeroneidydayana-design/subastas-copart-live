import json
import sqlite3
import os

# 1. Update src/services/seedData.ts
with open('src/services/seedData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

cli_target = "  {\n    id: 'cli-004',"
cli_replacement = """  {
    id: 'cli-005',
    full_name: 'Gustavo Medal',
    phone: 'Contacto WhatsApp',
    email: 'gustavo.medal@email.com',
    country: 'Estados Unidos',
    city: 'USA',
    registration_date: '2026-11-21',
    notes: 'Presupuesto de subasta: $2,500 USD. Interesado en Toyota Corolla confiable y en óptimas condiciones mecánicas.',
    status: 'listo_subasta',
    created_at: new Date('2026-11-21T12:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T12:00:00Z').toISOString(),
  },
  {
    id: 'cli-004',"""
if 'cli-005' not in content:
    content = content.replace(cli_target, cli_replacement, 1)

veh_corolla = """  {
    id: 'veh-corolla-2015-67797166',
    brand: 'Toyota',
    model: 'Corolla LE',
    year: 2015,
    version: '1.8L 4-Cyl Automatic Sedan',
    vin: '2T1BURHE5FC482910',
    lot_number: '67797166',
    reference_url: 'https://www.copart.com/lot/67797166',
    engine: '1.8L 4-Cilindros DOHC 16V VVT-i',
    displacement: '1.8L',
    transmission: 'Automática CVTi-S',
    drivetrain: 'FWD',
    fuel: 'Gasolina',
    odometer: 138551,
    odometer_unit: 'mi',
    exterior_color: 'Negro',
    interior_color: 'Gris Carbón',
    title_type: 'clean',
    vehicle_condition: 'run_and_drive',
    primary_damage: 'Desgaste Normal',
    secondary_damage: 'Abolladuras/Arañazos Menores',
    auction_reason: 'Liquidación de Inventario Certificado',
    sale_date: 'Viernes, 27 de Noviembre de 2026 • 01:00 PM EST',
    has_keys: true,
    location: 'Houston (TX)',
    equipment: [
      'Quemacocos / Sunroof Eléctrico',
      'Rines Deportivos de Aleación en Negro',
      'Sistema de Pantalla Táctil con Cámara de Reversa',
      'Aire Acondicionado Automático',
      'Control Crucero y Controles al Volante',
      'Frenos ABS y Control de Estabilidad VSC',
      'Transmisión Automática Secuencial',
      'Llave Original Incluida'
    ],
    notes: 'Vehículo verificado Run and Drive por Copart. Motor arranca con suavidad y transmisión engrana en todos los cambios. Carrocería completa sin deformaciones estructurales. Título Limpio oficial de Texas listo para documentación, registro y traspaso inmediato.',
    est_retail_value: 9850,
    images: [
      { id: 'img-corolla-1', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_1.jpg', category: 'exterior', is_primary: true, order: 1, caption: 'Vista 3/4 Delantera Izquierda - 2015 Toyota Corolla LE' },
      { id: 'img-corolla-2', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_2.jpg', category: 'exterior', is_primary: false, order: 2, caption: 'Perfil Delantero Derecho y Rines Deportivos' },
      { id: 'img-corolla-3', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_3.jpg', category: 'exterior', is_primary: false, order: 3, caption: 'Costado Trasero Derecho y Línea de Carrocería' },
      { id: 'img-corolla-4', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_4.jpg', category: 'exterior', is_primary: false, order: 4, caption: 'Vista Trasera Completa - Emblemas y Maletero' },
      { id: 'img-corolla-5', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_5.jpg', category: 'exterior', is_primary: false, order: 5, caption: 'Perspectiva Lateral Izquierda y Quemacocos' },
      { id: 'img-corolla-6', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_6.jpg', category: 'exterior', is_primary: false, order: 6, caption: 'Frente Directo - Ópticas, Parrilla y Bumper Intactos' },
      { id: 'img-corolla-7', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_7.jpg', category: 'exterior', is_primary: false, order: 7, caption: 'Vista de Techo y Sunroof Abierto' },
      { id: 'img-corolla-8', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_8.jpg', category: 'interior', is_primary: false, order: 8, caption: 'Cabina Principal - Tapicería, Volante y Consola' },
      { id: 'img-corolla-9', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_9.jpg', category: 'tablero', is_primary: false, order: 9, caption: 'Cuadro de Instrumentos - 138,551 mi Sin Testigos Críticos' },
      { id: 'img-corolla-10', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_10.jpg', category: 'mecanica', is_primary: false, order: 10, caption: 'Bahía de Motor 1.8L VVT-i - Fluídos y Componentes Completos' },
      { id: 'img-corolla-11', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_11.jpg', category: 'interior', is_primary: false, order: 11, caption: 'Asientos Traseros y Espacio Interior Impecable' },
      { id: 'img-corolla-12', vehicle_id: 'veh-corolla-2015-67797166', url: '/vehicles/corolla2015/67797166_Image_12.jpg', category: 'otros', is_primary: false, order: 12, caption: 'Placa de Identificación VIN y Verificación de Puerta' }
    ],
    custom_badges: {
      runDriveText: 'RUN & DRIVE',
      titleTypeText: 'TX - CLEAN TITLE',
      carfaxEnabled: true,
      carfaxText: 'Lote Verificado Oficial ✓',
      carfaxTitleStatus: 'Texas Clean Title (Documentación Lista para Traspaso)',
      carfaxVerifiedNotes: 'Run & Drive certificado por Copart. Llaves incluidas. Cero colisiones graves. Título limpio listo para documentación y registro vehicular.',
      carfaxOwners: 'Historial Registrado y Verificado',
      carfaxServiceRecords: 'Mantenimientos al Día',
      carfaxAccidents: 'Sin Daños Estructurales (Solo Desgaste Normal)',
      extraBadges: []
    },
    created_at: new Date('2026-11-21T12:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T12:00:00Z').toISOString(),
  }
];

export const INITIAL_SESSIONS:"""
if 'veh-corolla-2015-67797166' not in content:
    content = content.replace('];\n\nexport const INITIAL_SESSIONS:', veh_corolla, 1)

session_gustavo = """  {
    id: 'ses-live-corolla',
    client_id: 'cli-005',
    vehicle_id: 'veh-corolla-2015-67797166',
    title: 'Subasta Oficial en Vivo - 2015 Toyota Corolla LE',
    status: 'prepared',
    sale_date: 'Viernes, 27 de Noviembre de 2026 • 01:00 PM EST',
    vehicle_snapshot: INITIAL_VEHICLES.find((v) => v.id === 'veh-corolla-2015-67797166') || INITIAL_VEHICLES[0],
    client_snapshot: INITIAL_CLIENTS.find((c) => c.id === 'cli-005') || INITIAL_CLIENTS[0],
    starting_price: 700,
    bid_increment: 50,
    expected_final_price: 2100,
    duration_seconds: 45,
    bid_interval_seconds: 3,
    total_planned_bids: 14,
    virtual_bidders: [
      { id: 'b-corolla-1', name: 'Texas Auto Traders LLC', location: 'TX' },
      { id: 'b-corolla-2', name: 'Sunbelt Fleet Wholesale', location: 'FL' },
      { id: 'b-corolla-3', name: 'Alamo City Motors', location: 'TX' },
      { id: 'b-corolla-client', name: 'Gustavo Medal (Cliente)', location: 'USA', is_client: true }
    ],
    expected_outcome: 'win',
    current_price: 700,
    current_bidder_id: undefined,
    current_bidder_name: undefined,
    current_bidder_location: undefined,
    is_client_winning: false,
    current_bid_count: 0,
    time_remaining_seconds: 45,
    is_paused: false,
    room_token: 'copart-live-gustavo',
    is_token_revoked: false,
    created_at: new Date('2026-11-21T12:00:00Z').toISOString(),
    updated_at: new Date('2026-11-21T12:00:00Z').toISOString(),
  },
  {
    id: 'ses-live-001',"""
if 'ses-live-corolla' not in content:
    content = content.replace("  {\n    id: 'ses-live-001',", session_gustavo, 1)

with open('src/services/seedData.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated src/services/seedData.ts successfully!')
