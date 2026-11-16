# MANUAL DE CAPACITACIÓN OPERATIVA DEL BROKER
## SISTEMA DE SUBASTAS EN VIVO — PUJAMOTOR USA (COPART VB3 TERMINAL)

---

## INTRODUCCIÓN Y PRINCIPIO DE OPERACIÓN

En la plataforma **PUJAMOTOR USA**, la experiencia de compra se fundamenta en un principio clave: **el broker es el director y operador técnico; el cliente es el observador y decisor financiero**.

El cliente nunca opera botones complejos ni configuraciones administrativas. Durante toda la sesión, el broker mantiene una llamada o videollamada activa (habitualmente por WhatsApp) mientras ambos visualizan la subasta:
* **El cliente** tiene abierta la **Ventana 1 (Sala Pública / Monitor del Comprador)**: una interfaz institucional limpia, idéntica a una terminal oficial de Copart VB3, sin controles de edición.
* **El broker** opera con la **Ventana 2 (Consola Privada del Subastador)** o con la **Paleta #101** autorizada, guiando la atención del cliente paso a paso.

---

## LAS 14 ETAPAS DE UNA SESIÓN REAL GUIADA

---

### ETAPA 1: RECEPCIÓN Y BIENVENIDA DEL CLIENTE
**Objetivo:** Confirmar conexión mutua, asegurar que el cliente tenga la pantalla visible y establecer un clima de tranquilidad y seriedad institucional.

* **Qué hace el broker en la plataforma:**
  * En la Consola Privada, abre el modal `[ WhatsApp VIP 📲 ]` y envía el enlace personalizado con token de comprador (`?cliente=bdr_buyer_...`) o le indica abrir el link recibido.
  * Verifica en la cabecera de la consola que el indicador de presencia marque la conexión del cliente (`1 Viewers in Lane`).
  * Asegura que la sala se encuentre en **FASE 1: PRE-SUBASTA (Inspección Previa)** con estado `prepared`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Hola [Nombre del Cliente], qué gusto saludarte. Ya te envié el enlace directo a nuestra terminal de subasta. Ábrelo en tu computadora o teléfono. Te pido que mantengas esta llamada activa para que vayamos conversando en tiempo real. Confírmame por favor en cuanto veas en tu pantalla el logo de Copart con el carril 'LANE A • Atlanta East Yard 12'."*
* **Qué debe observar el cliente en pantalla:**
  * El encabezado azul marino con el logo oficial de Copart y el indicador verde `LIVE BROADCAST`.
  * La etiqueta del carril `LANE A • Atlanta East Yard 12`.
  * El letrero en recuadro azul: `FASE 1: SALA ABIERTA • INSPECCIÓN PREVIA`.
  * El reloj horario de Estados Unidos (`EST`) en la parte superior derecha.

---

### ETAPA 2: EXPLICACIÓN DE CÓMO FUNCIONA LA SALA
**Objetivo:** Eliminar la ansiedad del cliente, aclarando que él no tiene que presionar botones de puja y que su capital está protegido.

* **Qué hace el broker en la plataforma:**
  * En la sala, señala el botón `[ ¿Cómo funciona? ]` (o en la Consola Privada proyecta un anuncio en marquesina mediante `handleSendAnnouncement`).
* **Qué le dice al cliente (Guion del Broker):**
  > *"[Nombre], esta pantalla que tienes enfrente es un espejo de la terminal de remates en vivo desde los patios de Estados Unidos. Quiero que estés totalmente tranquilo: tú no tienes que presionar ningún botón de compra ni pujar por error. Yo como tu broker autorizado estoy conectado con la Paleta Oficial #101. Cada oferta que yo haga en la subasta será consultada previamente contigo y respetará con exactitud el presupuesto máximo que acordamos. Tú solo observa la pantalla mientras yo opero."*
* **Qué debe observar el cliente en pantalla:**
  * En la columna derecha, el panel institucional que indica: `Modo Espectador Autorizado — Tu broker oficial te representa en vivo con la Paleta #101`.
  * El indicador de presupuesto pactado (por ejemplo, `Tope Máximo de Capital: $7,500 USD`).

---

### ETAPA 3: PRESENTACIÓN DEL VEHÍCULO, NÚMERO DE LOTE Y FOTOS
**Objetivo:** Validar la identidad de la unidad que se va a rematar y enfocar el interés del cliente en el vehículo correcto.

* **Qué hace el broker en la plataforma:**
  * Muestra el bloque superior del vehículo en la columna izquierda.
  * Señala el número de lote oficial (ej. `#65012146` o `#88192003`), el año, marca y modelo.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Fíjate en la esquina superior izquierda de la fotografía. Ahí tienes el número de lote oficial #[Número de Lote]. Esta unidad es exactamente la que revisamos: un [Año, Marca, Modelo y Versión]. Debajo del título puedes ver el valor comercial estimado en el mercado estadounidense ($[Valor] USD), lo que nos da el margen de rentabilidad para la compra de hoy."*
* **Qué debe observar el cliente en pantalla:**
  * La insignia sobre la foto: `LOT #[Número de Lote]`.
  * El título en letras blancas grandes: `2023 Ford Mustang GT` (o el vehículo activo).
  * El valor de referencia comercial en verde: `EST. RETAIL VALUE: $42,000 USD`.

---

### ETAPA 4: GALERÍA HD Y CATEGORÍAS DE FOTOGRAFÍAS
**Objetivo:** Realizar la inspección visual 360°, revisar daños y detalles mecánicos utilizando el clasificador de fotos.

* **Qué hace el broker en la plataforma:**
  * Le indica al cliente hacer clic en el botón superior derecho de la foto `[ Galería HD ]` o él mismo le guía pulsando los botones de categorías: `Exterior`, `Interior`, `Motor`, `Tablero`, `Daños`.
  * Si el vehículo tiene sonido de motor configurado, le indica oírlo con `[ Engine Sound 🔊 ]`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Vamos a inspeccionar la unidad a fondo. Justo debajo de la fotografía tienes una barra de clasificación: 'Exterior', 'Interior', 'Motor', 'Tablero' y 'Daños'. Si pulsas 'Motor', verás la fotografía directa del bloque motor para confirmar que no tiene fugas estructurales. Si pulsas 'Daños', vemos el golpe exacto reportado en patio. Además, si pulsas el botón 'Galería HD' en la esquina de la foto, puedes ampliar cada detalle a pantalla completa."*
* **Qué debe observar el cliente en pantalla:**
  * La tira de miniaturas cambiando según la categoría seleccionada.
  * El modal de pantalla completa `ImageGalleryModal` con fotos en alta definición.
  * Las insignias `RUN & DRIVE` (verde) y `CLEAN TITLE` o `SALVAGE TITLE` (azul/ámbar).

---

### ETAPA 5: ESPECIFICACIONES TÉCNICAS Y CONDICIONES DEL VEHÍCULO
**Objetivo:** Repasar odómetro, presencia de llaves, tipo de daño y mecánica para certificar la viabilidad de la compra.

* **Qué hace el broker en la plataforma:**
  * Desplaza la vista a la cuadrícula de especificaciones técnicas (centro de la columna izquierda).
  * Si el cliente prefiere kilómetros, le muestra el conmutador `[ A KM ]` junto al odómetro.
  * Muestra el estado del VIN y el botón de copiado.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Revisemos los puntos críticos de patio: el odómetro marca [Millas] millas; si presionas el botón 'A KM', el sistema te lo convierte automáticamente a kilómetros. En la casilla 'LLAVES', confirmamos que tiene el letrero verde 'SÍ (PRESENTES)', lo cual nos ahorra costos de cerrajería y programación. El daño principal catalogado es [Daño Principal] y la condición de rodamiento está certificada como 'RUN & DRIVE', lo que significa que el auto arrancó y traccionó al llegar a las instalaciones."*
* **Qué debe observar el cliente en pantalla:**
  * Cuadro de Odómetro con número grande y selector `MI / KM`.
  * Casilla de llaves con ícono de llave verde: `SÍ (PRESENTES)`.
  * Casillas de daño primario y secundario.
  * Casilla de VIN con botón de visualización/ocultamiento (`Eye`) y botón de copiar (`Copy`).

---

### ETAPA 6: ENLACE OFICIAL DE COPART Y EXPEDIENTE DE PATIO
**Objetivo:** Demostrar transparencia absoluta, mostrando que el vehículo existe físicamente en las instalaciones de Copart en EE. UU.

* **Qué hace el broker en la plataforma:**
  * Señala la pastilla integrada en la cabecera: `FICHA OFICIAL DE LOTE ↗` (o `Expediente del Lote ↗` sobre la foto).
  * También abre el botón `[ Auditoría Copart: 6/6 ✓ ]`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Para que tengas total certeza de que no se trata de una publicación genérica, fíjate en la parte superior donde dice 'FICHA OFICIAL DE LOTE ↗'. Al hacer clic allí, se te abre en otra pestaña la página directa de Copart en Estados Unidos correspondiente a este mismo número de lote, donde ves la ubicación física en el patio de Atlanta East Yard 12. Y si presionas el botón 'Auditoría Copart 6/6', verás la verificación técnica de los 6 pilares: lote real, subasta calendarizada, broker acreditado y pagos contractuales."*
* **Qué debe observar el cliente en pantalla:**
  * La nueva pestaña con la ficha técnica original en `copart.com`.
  * El modal `CopartVerificationModal` con los 6 escudos de verificación en color verde y azul.

---

### ETAPA 7: INDICADORES, PALETAS, PARTICIPANTES E HISTORIAL
**Objetivo:** Familiarizar al cliente con los postores que van a competir en el carril y explicar la paleta representante.

* **Qué hace el broker en la plataforma:**
  * Señala el `TABLERO DE PALETAS AUTORIZADAS (LANE A)` debajo de la ficha técnica.
  * Muestra las 7 paletas oficiales (`#101` Broker Rep., `#108` AutoExport Dallas, `#214` Pacific Salvage, etc.).
  * En la columna derecha, selecciona la pestaña `Historial de Ofertas` y `Participantes`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Mira el tablero inferior: en este carril estamos conectados 7 postores autorizados con licencia para pujar en este lote. Nosotros somos la Paleta #101 'Broker Rep.'. Los otros seis son concesionarios mayoristas de Texas, California, Georgia y Chicago. En la columna derecha, en la pestaña 'Historial', quedará registrada cada oferta en milisegundos con su número correlativo y su hora exacta."*
* **Qué debe observar el cliente en pantalla:**
  * Las 7 tarjetas de paletas con sus nombres de empresa y estados (Miami, Dallas, Los Ángeles, etc.).
  * Su paleta `#101` destacada en borde azul institucional.
  * El indicador `WEBSOCKET ACTIVO` en color esmeralda.

---

### ETAPA 8: PRECIO VIGENTE Y RELOJ DE CUENTA REGRESIVA
**Objetivo:** Explicar cómo se lee el precio del martillero y la regla del temporizador de 10 segundos.

* **Qué hace el broker en la plataforma:**
  * En la columna derecha, señala el gran marcador verde `$X,XXX USD` y el reloj circular `CircularCountdown`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"En el centro de la columna derecha tienes el marcador 'PRECIO VIGENTE DE SUBASTA'. El precio de arranque son $[Precio Inicial] USD. Al lado tienes el reloj circular oficial: funciona con un conteo regresivo de 10 segundos. Cada vez que alguien entra con una nueva puja, el reloj se reinicia automáticamente a 10 segundos para dar tiempo a responder. Si el reloj llega a cero con nosotros a la cabeza, el auto es nuestro."*
* **Qué debe observar el cliente en pantalla:**
  * El marcador grande en verde: `$5,000 USD`.
  * El reloj circular SVG marcando `10s` en color esmeralda con el letrero `TIEMPO RESTANTE`.
  * El desglose desplegable `Calculadora de Tarifas Copart` con las tarifas oficiales de salida de patio, comisión VB3 y títulos.

---

### ETAPA 9: MANEJO DESDE LA CONSOLA PRIVADA (VENTANA 2)
**Objetivo:** El broker opera la subasta entre bastidores mientras el cliente solo recibe la telemetría oficial.

* **Qué hace el broker en la plataforma:**
  * En su segunda pantalla (o pestaña privada), el broker tiene abierta la `AuctioneerPrivateConsole`.
  * Presiona el botón verde `[ Abrir / Iniciar ]`.
  * Si desea ritmo automático, activa el interruptor `[ 🤖 Auto-Puja: ON ]`.
  * Si opera manualmente, utiliza el panel rápido de la **Paleta #101** con los botones `[ ⚡ Pujar #101 (+250) ]` o lanza pujas de competidores seleccionando la paleta correspondiente en la columna 1.
* **Qué le dice al cliente (Guion del Broker):**
  > *"[Nombre], acaban de dar apertura formal al carril. Escucharás la voz del martillero en inglés dando las especificaciones de entrada. A partir de este momento el lote entra en disputa activa. Mantente atento al marcador mientras yo voy gestionando nuestras ofertas."*
* **Qué debe observar el cliente en pantalla:**
  * El estado de la sala cambia de azul (`PRE-SUBASTA`) a verde pulsante: `SUBASTA EN VIVO (SALE IN PROGRESS)`.
  * El reloj de 10 segundos empieza a descontar: `9... 8... 7...`.
  * Se escucha la bienvenida del martillero en inglés anunciando el lote.

---

### ETAPA 10: LLAMADAS DEL MARTILLERO, ANIMACIONES Y AVISOS
**Objetivo:** Guiar al cliente cuando el remate entra en su fase de cierre y tensión.

* **Qué hace el broker en la plataforma:**
  * Desde la Consola Privada, cuando el precio se acerca al objetivo o no hay nuevas ofertas, presiona sucesivamente:
    * `GOING ONCE`
    * `GOING TWICE`
    * `FAIR WARNING`
* **Qué le dice al cliente (Guion del Broker):**
  > *"Atento, [Nombre]: el subastador está haciendo la primera llamada: 'GOING ONCE' (A la una). Aparece el cartel amarillo en pantalla. Si nadie sube la puja, pasará a 'GOING TWICE' (A las dos) en naranja. La última advertencia es 'FAIR WARNING' (Martillo en alto). En ese momento, si somos nosotros los líderes, no ofertamos más; dejamos caer el martillo."*
* **Qué debe observar el cliente en pantalla:**
  * Mega banners animados con borde parpadeante:
    * Amarillo: `📢 GOING ONCE — ¡A LA UNA!`
    * Naranja: `🔥 GOING TWICE — ¡A LAS DOS!`
    * Rojo: `⚠️ FAIR WARNING — ¡ÚLTIMA ADVERTENCIA!`
  * La voz oficial del martillero cantando cada aviso con el sonido del golpe previo.

---

### ETAPA 11: SECUENCIA DE OFERTAS CON PALETA #101 Y PRESUPUESTO
**Objetivo:** Demostrar cómo se puja y cómo se solicita autorización si la subasta exige un esfuerzo adicional dentro del rango del cliente.

* **Qué hace el broker en la plataforma:**
  * Cuando un competidor oferta (ej. Paleta #108 a $5,500), el broker presiona `[ ⚡ Pujar #101 (+250) ]`.
  * La sala sube a $5,750 USD y se enciende el letrero verde de postor líder.
  * **Si se alcanza el tope pactado:** la plataforma bloquea la puja automática y muestra la solicitud de incremento extraordinario. El broker envía la solicitud y al cliente le aparece en pantalla el modal con los botones `[ Autorizar +$500 ]` o `[ Detener Subasta ]`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Acaban de ofertar $5,500 desde Dallas. Yo acabo de responder con nuestra Paleta #101 a $5,750. Mira tu pantalla: se puso en verde y dice '¡TU BROKER VA GANANDO LA PUJA!'. Estamos dentro del presupuesto previsto. Si otro postor empuja al límite de los $7,500, te consultaré de inmediato en pantalla antes de dar cualquier paso adicional."*
* **Qué debe observar el cliente en pantalla:**
  * El letrero verde animado: `✓ ¡TU BROKER VA GANANDO LA PUJA! (Paleta #101)`.
  * El tablero de paletas marcando a la `Paleta #101` con la insignia dorada `★ LÍDER`.
  * El sonido de confirmación de puja de Copart (`Chime`).

---

### ETAPA 12: COMUNICACIÓN DE CADA MOVIMIENTO DURANTE LA SUBASTA
**Objetivo:** Mantener la serenidad y la confianza del cliente en los momentos de contraoferta rápida.

* **Qué hace el broker en la plataforma:**
  * Supervisa el contador de tiempo y las entradas en el `Historial de Ofertas`.
  * Si entra una puja competidora, no se precipita; espera que el reloj baje a 4 o 3 segundos antes de contraofertar (ritmo profesional de subasta estadounidense).
* **Qué le dice al cliente (Guion del Broker):**
  > *"Nos superó la Paleta #214 de Los Ángeles a $6,000. Tranquilo, no nos desesperamos. Dejemos correr el reloj a 4 segundos... y ahora contraofertamos a $6,250. Listo, retomamos la punta. El reloj vuelve a 10 segundos. La presión la tienen ellos."*
* **Qué debe observar el cliente en pantalla:**
  * El cambio de estado momentáneo a rojo: `SUPERADO POR: Paleta #214`.
  * La recuperación inmediata al emitir la oferta: de nuevo en verde `¡TU BROKER VA GANANDO LA PUJA!`.
  * El historial sumando cada oferta en tiempo real.

---

### ETAPA 13: CIERRE SOLD O UNSOLD Y RESULTADO FINAL
**Objetivo:** Formalizar la adjudicación ganadora o explicar con profesionalismo la reserva no alcanzada.

#### CASO A: GANADORES (SOLD)
* **Qué hace el broker en la plataforma:**
  * En la Consola Privada, pulsa `[ SOLD (Adjudicar Lote) ]`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"¡Felicidades, [Nombre]! ¡El vehículo es tuyo! Escucha el martillazo final: 'SOLD!'. Cerramos la unidad en $[Precio Final] USD, muy por debajo del valor de mercado. En este momento el lote queda bloqueado a nuestro favor y la plataforma genera el comprobante de adjudicación oficial de Copart."*
* **Qué debe observar el cliente en pantalla:**
  * Lluvia de confeti animada en toda la pantalla.
  * Sonido de fanfarria triunfal y golpe de martillo.
  * El estado cambia a azul/verde esmeralda: `¡LOTE ADJUDICADO! (LOT SOLD)`.
  * Botón para abrir el `Certificado Oficial de Adjudicación (Bill of Sale)`.

#### CASO B: NO ALCANZÓ RESERVA (UNSOLD)
* **Qué hace el broker en la plataforma:**
  * En la Consola Privada, pulsa `[ UNSOLD (No Vendido) ]`.
* **Qué le dice al cliente (Guion del Broker):**
  > *"[Nombre], el vendedor de la compañía de seguros tenía una reserva mínima que no fue alcanzada dentro de nuestro límite inteligente. Como acordamos proteger tu dinero, no sobrepagamos. El lote queda en estatus 'UNSOLD'. Esto es positivo: ahora tenemos la opción de negociar en oferta directa 'Make An Offer' o pasar de inmediato al siguiente lote de nuestra lista."*
* **Qué debe observar el cliente en pantalla:**
  * Letrero institucional en ámbar: `CLOSED — RESERVE NOT MET (UNSOLD)`.
  * Ausencia de penalizaciones y confirmación de que su depósito se mantiene 100% intacto.

---

### ETAPA 14: TERMINACIÓN DE LA SESIÓN Y DESPEDIDA
**Objetivo:** Instruir al cliente sobre los pasos administrativos siguientes (liquidación bancaria o preparación del siguiente lote) y cerrar la llamada con calidez y rigor corporativo.

* **Qué hace el broker en la plataforma:**
  * En la consola genera el enlace al expediente documental (`DocumentView`) o presiona `[ Atender Siguiente Cliente y Cargar Lote ]`.
  * Puede revocar el acceso del lote saliente mediante `revoke-access` para que la sala quede limpia para el próximo participante.
* **Qué le dice al cliente (Guion del Broker):**
  > *"Excelente trabajo hoy, [Nombre]. En los próximos 10 minutos vas a recibir a tu WhatsApp y correo el desglose oficial de liquidación con la cuenta fiduciaria contractual de Copart para coordinar la transferencia bancaria y la liberación de patio para el transporte terrestre. Ha sido un placer asesorarte en esta subasta. Quedo atento a tus comprobantes para dar seguimiento al retiro de la unidad."*
* **Qué debe observar el cliente en pantalla:**
  * La pantalla de acceso concluido `RoomAccessExpiredView` con agradecimiento institucional y botón de salida, o el documento formal del Bill of Sale generado.

---

## GUION COMPLETO DE EJEMPLO DE PRINCIPIO A FIN

A continuación se presenta la transcripción de una sesión real modelo entre el broker (**Carlos**) y el cliente (**Roberto**) rematando un **Ford Mustang GT 2023** con presupuesto de **$7,500 USD**:

```text
[00:00] CARLOS (Broker): "Roberto, buenos días. Te habla Carlos de Pujamotor USA. 
        Ya tengo la terminal enlazada con el carril de subastas de Copart. 
        Por favor ingresa al enlace que te acabo de mandar por WhatsApp."

[00:25] ROBERTO (Cliente): "Listo Carlos, ya lo abrí. Veo el logo de Copart arriba 
        y un auto negro en grande."

[00:32] CARLOS (Broker): "Exactamente. Fíjate en la esquina superior de la foto: 
        Lote #65012146. Corresponde al Mustang GT 2023 con 14,250 millas que 
        revisamos ayer. Si te fijas en la ficha técnica, tenemos las llaves 
        presentes y el título certificado Run and Drive."

[00:50] ROBERTO: "Perfecto. ¿Tengo que tocar algún botón para cuando empiece?"

[00:54] CARLOS: "Para nada, Roberto. Tú no tienes que tocar nada. En tu pantalla 
        verás que dice 'Modo Espectador'. Yo tengo la Paleta #101 asignada a tu 
        nombre. Nuestro límite estricto son $7,500 USD. Cada movimiento lo 
        hago yo consultándolo contigo."

[01:15] CARLOS: "Voy a iniciar la sala ahora mismo. Escucharás al martillero."
        (Carlos pulsa [Abrir / Iniciar] en su Consola Privada)

[01:20] SUBASTADOR (Audio en inglés): "Welcome to Lane A, lot 65012146, 2023 Ford Mustang GT, 
        starting at 5,000 dollars! Who will bid 5,000?"

[01:28] CARLOS: "Arranca en $5,000 USD. La Paleta #108 de Dallas acaba de ofrecer $5,250."
        (El marcador sube a $5,250 y el reloj marca 10s)

[01:35] CARLOS: "¿Autorizas ir por $5,500?"
[01:37] ROBERTO: "Sí, adelante."
[01:38] (Carlos pulsa [⚡ Pujar #101 (+250)])
        (En pantalla de Roberto se enciende el banner verde: '¡TU BROKER VA GANANDO LA PUJA! - $5,500')

[01:42] CARLOS: "Ahí estamos a la cabeza en $5,500. Mira el reloj descontando... 7, 6, 5..."

[01:45] (Entra puja de Paleta #214 a $5,750 USD. La pantalla pasa a 'SUPERADO')
[01:47] CARLOS: "Entró California con $5,750. Vamos a contestar con $6,000."
        (Carlos pulsa [+250])
        (El marcador sube a $6,000. Paleta #101 vuelve a ser líder)

[01:58] CARLOS: "Estamos en $6,000. El resto de las paletas guardó silencio. 
        Mira la pantalla: el subastador lanza 'GOING ONCE' (A la una)."
        (Aparece cartel amarillo: GOING ONCE)

[02:08] CARLOS: "Nadie respondió. Viene 'GOING TWICE' (A las dos)."
        (Aparece cartel naranja: GOING TWICE)

[02:15] CARLOS: "Última llamada: 'FAIR WARNING'. Martillo en el aire... no ofertamos más..."
        (Carlos pulsa [SOLD])

[02:20] SUBASTADOR: "SOLD! Sold for 6,000 dollars to paddle 101!"
        (Lluvia de confeti en la pantalla de Roberto, fanfarria y letrero 'LOTE ADJUDICADO')

[02:25] CARLOS: "¡Enhorabuena Roberto! ¡Vehículo ganado por $6,000 USD! 
        Te ahorraste $1,500 de tu presupuesto tope. Enseguida te paso el 
        comprobante oficial para proceder con la liquidación bancaria."

[02:38] ROBERTO: "¡Excelente Carlos, qué transparencia! Quedo a la espera del documento."
```

---

## RESUMEN DE REGLAS DE ORO PARA EL BROKER

1. **Nunca dejar al cliente en silencio:** la subasta es rápida; el broker debe narrar verbalmente lo que está ocurriendo en el reloj y en el marcador.
2. **Respetar religiosamente el tope de capital:** si la subasta supera el presupuesto pactado, nunca pujar sin que el cliente presione el botón de autorización en pantalla.
3. **Usar la Ficha Oficial de Copart como respaldo institucional:** abrirla siempre antes de comenzar para despejar cualquier sospecha de publicación simulada.
4. **Mantener la calma en las contraofertas:** no responder en el segundo 9; dejar correr el reloj hasta los 3-4 segundos para frenar el ímpetu de los otros postores.
5. **Celebrar el SOLD o proteger el dinero en el UNSOLD:** ambas resoluciones demuestran profesionalismo y compromiso con los intereses del comprador.

