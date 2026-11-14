# Copart VB3 Live - Simulador y Gestión de Subastas Automotrices

Plataforma profesional para la gestión de clientes, catálogo de vehículos y presentaciones de subastas automotrices simuladas en **salas gemelas al estilo Copart VB3 Live Auctions**.

---

## 🚀 Características Principales

1. **Sala Gemela Copart VB3 Live**:
   - Logotipo oficial de Copart con óvalo metálico, arco azul y punto rojo indicador.
   - Distribución de terminal de subasta automotriz: información de pista (Lane A), lote, reloj del servidor y estado de audio.
   - **Contador circular de 10 segundos** idéntico a Copart con cambios dinámicos de color (Verde, Amarillo, Rojo "Last Call" y "Sold!").
   - Indicador de puja actual con grandes dígitos, badge de "OFERTA GANADORA" vs "SUPERADO".
   - Botones rápidos de oferta (+100, +250, +500, +1,000 Monster Bid).
   - Flujo de ofertas cronológico con sonido de campana de subasta y registro de participantes.
   - Sonidos procedurales (Web Audio API): campana Copart, martillo de madera (gavel), última llamada y fanfarria con confeti.

2. **Consola del Operador (Admin Dock)**:
   - Control total en vivo: Iniciar, pausar, reanudar, avanzar 1 oferta de competidor, forzar oferta del cliente, bajar martillo (SOLD) y reiniciar.

3. **Acceso Privado para el Cliente**:
   - Enlace único con token seguro (ej. `#/sala/copart-live-...`).
   - El cliente accede directamente sin inicio de sesión en modo de solo lectura.
   - Sincronización instantánea de ofertas y tiempo restante.
   - Opción para revocar o regenerar el token en cualquier momento.

4. **Panel Administrativo Completo**:
   - **Inicio**: Métricas de clientes, vehículos, subastas preparadas, activas y cerradas.
   - **Clientes**: Registro, edición, seguimiento (nuevo, contactado, negociando, listo para subasta, cerrado) y ficha individual (dossier).
   - **Vehículos**: Identificación, especificaciones mecánicas, condiciones de daños y título, llaves, odómetro y galería de fotos categorizadas (Exterior, Interior, Motor, Tablero, Daños).
   - **Asistente de Subastas en 6 Pasos**:
     1. Selección de cliente
     2. Selección de vehículo
     3. Revisión de ficha y fotos
     4. Configuración de parámetros de simulación (precio inicial, incremento, precio previsto, participantes virtuales y resultado ganado/perdido)
     5. Resumen
     6. Creación y lanzamiento directo de la sala
   - **Historial y Resultados**: Actas de adjudicación con certificado oficial imprimible.
   - **Configuración**: Conexión con Supabase, pruebas de efectos de sonido y restablecimiento de datos.

5. **Base de Datos y Backend Supabase**:
   - Script SQL completo en `supabase/schema.sql` con las 10 entidades requeridas, claves foráneas, índices, Storage Bucket y políticas Row Level Security (RLS).
   - Modo dual: Funciona conectado a Supabase y también en modo demostración/local con persistencia y sincronización multi-pestaña inmediata.

---

## 🛠️ Comandos de Ejecución

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar compilación
npm run preview
```

---

## 📂 Estructura del Código

- `src/components/room/CopartLiveRoom.tsx`: Sala Gemela Copart VB3 en vivo.
- `src/components/room/CircularCountdown.tsx`: Contador circular visual.
- `src/components/common/CopartLogo.tsx`: Logo SVG de alta fidelidad.
- `src/components/admin/`: Vistas de Dashboard, Clientes, Vehículos, Asistente, Historial y Ajustes.
- `src/services/store.ts`: Motor de simulación, almacenamiento y sincronización en tiempo real.
- `src/lib/soundEffects.ts`: Sintetizador de audio procedural (sin dependencias externas).
- `supabase/schema.sql`: Migración PostgreSQL con RLS y Storage.
