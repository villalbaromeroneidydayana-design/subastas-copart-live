# MANUAL DE OPERACIÓN EN PRODUCCIÓN — PLATAFORMA COPART VB3™ LIVE

## 1. ARQUITECTURA DEL SISTEMA
* **Frontend:** React 19 + TypeScript + Tailwind CSS (Compilado en `dist/`).
* **Backend:** Express 5 + WebSockets nativos (`ws`) bajo puerto unificado (`3001`).
* **Base de Datos:** SQLite ACID con Write-Ahead Logging (`WAL`) en `data/auction.db`.
* **Seguridad:** CORS restringido, tokens criptográficos SHA-256 (`bdr_...`), aislamiento documental e inmunidad ante caídas o reinicios.

---

## 2. ENLACES DE ACCESO EN PRODUCCIÓN

### Enlaces Públicos (Internet / Móvil con HTTPS y WSS):
* **Consola del Broker (Operador):**  
  `https://purple-guests-return.loca.lt/#/`
* **Sala en Vivo del Cliente (Espectador):**  
  `https://purple-guests-return.loca.lt/#/sala/copart-live-m729k1`
* **Portal de Comprobantes Oficiales:**  
  `https://purple-guests-return.loca.lt/#/documento/:doc_token`
* **WebSocket Seguro (WSS):**  
  `wss://purple-guests-return.loca.lt`

### Enlaces Locales (Red LAN / Misma Oficina):
* **Consola Local:** `http://localhost:3001/#/`
* **En Red Local / WiFi:** `http://192.168.10.118:3001/#/`

---

## 3. GUÍA OPERATIVA PASO A PASO PARA EL BROKER

### Fase 1: Preparación e Inspección Previa
1. Ingrese a la Consola del Broker: `https://purple-guests-return.loca.lt/#/`
2. Seleccione el lote activo o cree uno nuevo con fotografías, VIN, kilometraje y especificaciones.
3. Fije el **Presupuesto Máximo del Cliente** (ej. `$14,000 USD`).
4. Haga clic en **`Copiar Acceso Cliente`** y envíe el enlace privado a su cliente por WhatsApp o correo:
   `https://purple-guests-return.loca.lt/#/sala/:room_token`
5. El cliente entrará a la **Fase 1 (Sala Abierta)**: podrá inspeccionar la ficha técnica, ver las fotos con zoom HD y observar el contador de espectadores en tiempo real. No verá botones de puja.

### Fase 2: Subasta en Directo
1. Cuando esté listo, pulse el botón verde **`Iniciar Subasta`**.
2. El reloj comenzará la cuenta regresiva oficial sincronizada a 1 Hz.
3. Para ofertar a nombre del cliente: use los botones de incremento rápido (`+$500`, `+$1,000`) o escriba el importe. El sistema no le permitirá ofertar por encima del presupuesto pactado.
4. Para generar dinamismo con otros ofertantes: use el botón **`Pujar Competencia (Lo manejo yo)`**. El motor subirá la puja con postores realistas de otros estados (*Dallas, Los Ángeles, Atlanta*) garantizando **siempre** que el precio quede por debajo del presupuesto del cliente para que su broker pueda ganar.
5. Cada oferta renueva el reloj a 10 segundos. Al bajar de 6 segundos sonará la alarma de **ÚLTIMA LLAMADA**.

### Fase 3: Adjudicación y Cierre Definitivo
1. Al ganar el lote, pulse **`Vender (SOLD)`**.
2. **Efecto Inmediato:**
   * La sala se cierra automáticamente para el cliente.
   * Su WebSocket es desconectado con código de cierre de seguridad.
   * Si el cliente intenta recargar o volver a entrar con el mismo enlace, verá la pantalla oficial:  
     *«SUBASTA FINALIZADA — Esta sala ha cerrado oficialmente y el acceso ha expirado»*.
3. El broker genera el comprobante en el modal pulsando **`Generar Comprobante`**.
4. Copie el enlace documental independiente:  
   `https://purple-guests-return.loca.lt/#/documento/:doc_token`
5. El cliente podrá ver su certificado oficial con sello digital, desglose de importes y botón directo de impresión (`Ctrl + P`).

---

## 4. COMANDOS DE MANTENIMIENTO Y SERVICIO

* **Iniciar en Producción:**
  Doble clic en `start-production.bat` o ejecute:
  ```bash
  npm run start
  ```
* **Compilar Cambios en Frontend:**
  ```bash
  npm run build
  ```
* **Limpieza de Datos Temporales (Retención):**
  Se ejecuta automáticamente cada hora, o bajo demanda vía API:
  ```bash
  POST /api/admin/maintenance/cleanup
  ```

