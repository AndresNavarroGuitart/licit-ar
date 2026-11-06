# Licit.AR — armar y presentar licitaciones

Estado: **preview estático**. No hay backend, no hay IA real y no está publicado en ningún lado.

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File licitaciones-app/serve.ps1   # http://localhost:3008
```

## Caso de referencia

El preview está armado leyendo un pliego real: **Concesión de uso del predio Mangrullo, Puerto de Rosario (ENAPRO)**, con sus Anexos I (memoria descriptiva), II (formulario de propuesta económica) y III (infraestructura mínima). Los datos de la empresa oferente, la biblioteca y los valores de la oferta son de ejemplo; **el checklist, los plazos, los montos y las reglas salen del pliego**, con artículo y página.

Qué enseñó este pliego sobre el producto:

- **No todas las licitaciones son "comprar bienes".** Esta es una concesión: la oferta no es una planilla de precios sino *canon mensual + plan de inversiones + proyecciones financieras*. El producto necesita un **tipo de licitación** que decida qué estructura de oferta lleva.
- **Un sobre único con tres carpetas** (Antecedentes, Oferta técnica, Oferta económica), páginas numeradas en forma correlativa, índice, original y copia, firmado en todas las hojas, y sin identificar al oferente por fuera.
- **Requisitos eliminatorios con números**: canon mínimo, inversión mínima y plazo máximo, tres indicadores financieros (liquidez > 1, endeudamiento < 1,5, margen > 0), garantía de $ 40 M. Son controles que el sistema puede calcular.
- **Plazos en días hábiles** y **plazos post-apertura**: el original de la garantía se entrega en 24 h; tras adjudicar hay 5 días hábiles para dos garantías nuevas y 20 para formalizar al concesionario.
- **La estructura cambia según cómo se presente el oferente**: individual o conjunta (UT / consorcio, hasta 5 integrantes) suma cuatro requisitos.
- **Las fechas del llamado no están en el pliego** (vienen en el aviso): hay que cargarlas aparte.

## Qué hace el producto

1. **Subís los archivos** (pliego y anexos).
2. **Arma la estructura**: requisitos por carpeta, cronograma, garantías, reglas de forma. Cada requisito tiene un botón `§` que abre el artículo y la página del pliego.
3. **Te dice qué falta armar**: cada requisito se resuelve con un documento de la biblioteca, un borrador redactado (13 plantillas de declaraciones y notas) o un archivo que subís.
4. **Completa el Anexo II** con canon e inversión (en números y en letras generadas), y arma el rótulo del sobre y el índice foliado.
5. **Revisa antes de presentar**: piso del canon, mínimo de inversión, indicadores, garantía y su vigencia, certificados que vencen antes de la apertura, consultas, visita técnica, plazos.
6. **Te muestra lo que viene si ganás**: garantías de cumplimiento y de ejecución, seguros, bonificación del canon.

## Mi empresa

Se pueden cargar **varias empresas o sociedades**. Cada una tiene:

- **Datos de la sociedad** (23 campos, agrupados): identificación, domicilio y contacto, representante y poder, beneficiarios finales y origen de fondos, datos financieros, ventas y experiencia. Cada campo dice en qué pliego se pide.
- **Documentos**, propios de esa empresa, con vencimiento. Se ven los **tipos de documento que piden sus licitaciones** y cuáles faltan, con un botón para cargarlos ahí mismo. Lo que piden otros pliegos cargados queda aparte.
- **Completitud**: datos cargados y documentos pedidos que ya tiene.
- Sus licitaciones.

Cada licitación tiene su **empresa que presenta**, que se elige en la pestaña Pliego. Esa empresa es la base de todo lo demás:

- **Notas, declaraciones y formularios** se redactan con sus datos.
- **Adjuntar** ofrece solo los documentos de esa empresa y avisa si falta alguno.
- **Cargar la información sin salir de la licitación:** en el Armado aparece un panel con los datos de la empresa que los borradores necesitan y todavía no están cargados; al abrir un borrador se ven y se editan los datos que usa, y el texto se actualiza al salir del campo. Cada documento que falta tiene "Subir archivo" en la misma fila. Todo se guarda en Mi empresa, no en la licitación.
- **Completar con los datos de Mi empresa** adjunta de una vez los documentos que ya tiene, y copia los datos financieros (concesión) o las ventas y la experiencia (licitación internacional).
- **Cambiar la empresa** de una licitación reasigna los documentos por los equivalentes de la nueva empresa.
- Una empresa con licitaciones no se puede eliminar, y en una licitación presentada no se puede cambiar la empresa.

Empresas de ejemplo (ficticias): Delta Marina Desarrollos S.A. (concesión de Mangrullo) y Litoral Seguridad y Tecnología S.R.L. (licitación internacional y comparaciones de precios). La segunda tiene dos datos sin cargar, para ver cómo se muestra lo pendiente.

## Licitaciones presentadas: solo lectura

Una licitación presentada se puede ver completa (resumen, requisitos, armado con sus documentos, oferta, revisión y pliego) pero la oferta queda **en solo lectura**: los campos aparecen bloqueados y las acciones que modifican (cambiar estados, adjuntar, simular, cambiar la modalidad) avisan que está presentada. Un banner permite **Habilitar edición** y **Volver a solo lectura**. El Seguimiento no se bloquea, porque después de presentar hay que seguir cargando apertura, adjudicación y ejecución. El ejemplo cargado es VUCE-663-CP-S (comparación de precios de servicios), ya presentada.

## Línea de tiempo

La tarjeta superior de cada licitación muestra, debajo de los días que faltan y del porcentaje de avance, una **línea de tiempo** horizontal con los hitos: visita técnica, últimas consultas, últimas circulares, presentación y apertura, garantía original (24 h) y fin del mantenimiento de oferta. "Hoy" queda marcado entre dos hitos según la fecha, y el hito que viene se resalta. Cuando se cargan las fechas en Seguimiento se suman adjudicación, garantías, firma, entrega de tenencia y fin de la inversión mínima. La fecha de apertura se edita en el Resumen y el resto se calcula con los plazos del pliego.

## Las seis etapas de una licitación

El producto sigue el proceso general desde el lado del **oferente**. Arriba de cada licitación hay un tablero con las etapas, y la pestaña **Seguimiento** tiene las tareas de cada una, con el plazo y el artículo del pliego:

| Etapa | Qué hace el oferente | Dónde está en el producto |
|---|---|---|
| 1. Planificación y preparación | Nada: lo hace la entidad (necesidad, presupuesto, pliegos) | Se muestra en el tablero, atenuada |
| 2. Convocatoria y consultas | Descargar el pliego, consultar, seguir circulares, hacer la visita técnica | Seguimiento: registro de consultas y circulares, plazos en días hábiles |
| 3. Presentación de ofertas | Armar propuesta técnica, económica y legal; constituir garantía; entregar el sobre | Requisitos, Armado, Oferta, Revisión y Presentación |
| 4. Apertura y evaluación | Acto de apertura, garantía original en 24 h, aclaraciones en 48 h, mejora de oferta, dictamen | Seguimiento: resultado de la apertura, mejora de canon con su validación |
| 5. Adjudicación y contratación | Notificación, garantías de cumplimiento y de ejecución (5 días hábiles), constitución del concesionario (20), firma (30) | Seguimiento: cargás la fecha de notificación y los plazos se calculan |
| 6. Ejecución y cierre | Entrega de tenencia, canon bonificado, inversión mínima en 30 meses, informes, prórroga, devolución del predio | Seguimiento: fecha de tenencia, avance de la inversión y canon por período |

Las tareas de la etapa 3 se marcan solas según lo cargado. Los plazos de las etapas 4 a 6 salen del pliego de Mangrullo (Art. II.6 a II.11, III.1 a III.5, IV.3, IV.4, IV.12, IV.13, I.6 y I.7). **Simular el recorrido completo** arma la oferta y recorre las etapas 3 a 6 con hechos ficticios; las fechas posteriores a hoy son simuladas.

## Simulación del armado y la confección de la oferta

En **Armado → "Simular el armado de la oferta"** el sistema arma, con una empresa ficticia (Delta Marina Desarrollos S.A.), todo el sobre de Mangrullo paso a paso y en el orden del pliego:

1. Redacta las 14 declaraciones y notas con los datos de la empresa.
2. Adjunta los documentos de la biblioteca y renueva los certificados que vencen antes de la apertura.
3. Elabora los documentos técnicos y económicos. **Se calculan a partir de lo cargado en la pestaña Oferta**, así que si cambiás el canon, la inversión o los plazos, cambian los documentos:
   - Plan de inversiones por rubro, curva de avance mensual e hitos porcentuales.
   - Cronograma de obras (Gantt) y plan operativo con implantación del predio.
   - Planos de conjunto (1:500) y corte, memoria descriptiva, organigrama y adecuación al Anexo III.
   - Proyecciones financieras y flujo de fondos a 20 años con la bonificación del canon; TIR, recupero y VAN.
   - Patrimonio, fuentes de financiación, indicadores certificados, antecedentes y seguros.
4. Constituye la garantía de oferta, numera el sobre (246 páginas) y corre los controles.

Cada requisito listo tiene **Ver documento**. **Ver pliego completo** (`#/l/:id/paquete`) junta rótulo del sobre, índice y todos los documentos en orden con sus páginas, y se puede imprimir o guardar como PDF desde el navegador. Todo es ficticio y está marcado así.

## Cargar y editar en cada punto

Cada requisito (pestañas Requisitos y Armado) y cada paso de las etapas (pestaña Seguimiento) tiene un botón **Cargar / editar** que abre un panel con todo en el mismo lugar:

- **Archivos:** se agregan, se abren y se quitan. Se guardan de verdad en el navegador (IndexedDB), así que se pueden volver a abrir; no se suben a ningún servidor. Se aceptan hasta 50 MB por archivo.
- **Estado, notas y fecha** del paso. En los requisitos, el estado se cambia a mano; en los pasos que se marcan solos según lo cargado, solo se agregan archivos y notas.
- **Según el origen del requisito:** documento de la biblioteca (cambiar, quitar o subir uno nuevo, que queda en Mi empresa), borrador (completar los datos y **editar el texto a mano**, con "Volver al original"), archivo a subir, o link a la pestaña Oferta.
- Las licitaciones presentadas muestran los requisitos en solo lectura; el seguimiento sigue editable.
- El pliego final nombra los archivos adjuntos; el contenido de esos archivos no se mezcla con los documentos de ejemplo.

## Pantallas

| Ruta | Pantalla |
|---|---|
| `#/` | Licitaciones, con buscador (número, título, organismo, tipo) y filtro por estado: por analizar, en preparación, presentada, adjudicada, en ejecución |
| `#/l/:id/pliego` | **Resumen previo del pliego**: pasos a completar por etapa, condiciones generales con su artículo y plazos generales con su fecha. Se imprime |
| `#/nueva` | Subir archivos y analizar |
| `#/l/:id/resumen` | Qué armar, modalidad (individual o UT), faltantes, cronograma, datos clave, si resultás adjudicatario |
| `#/l/:id/archivos` | Archivos del expediente |
| `#/l/:id/requisitos` | Checklist por carpeta con fuente en el pliego |
| `#/l/:id/armado` | Resolver cada requisito, páginas, reglas de forma, vista previa del pliego |
| `#/l/:id/oferta` | Canon (bonificación y total), inversión, garantía de oferta, indicadores financieros, Anexo II |
| `#/l/:id/revision` | Controles bloqueantes y avisos; lleva al armado final |
| `#/l/:id/entrega` | **Presentación (armado final)**: contenido final con páginas, formato y lugar de entrega según el pliego, control final (automático y manual), descarga real del documento (HTML para pasar a PDF, Word `.doc` e índice en CSV), texto del correo para los envíos por mail y registro de la entrega, que marca la licitación como presentada |
| `#/l/:id/seguimiento` | Etapas 2 a 6: tareas con plazos del pliego, consultas, apertura, mejora, adjudicación y ejecución |
| `#/l/:id/paquete` | Pliego final: rótulo, índice y todos los documentos con sus páginas, imprimible |
| `#/biblioteca` y `#/biblioteca/:id` | Documentos agrupados por licitación (expediente, biblioteca usada, archivos subidos y propios), con buscador en vivo, filtro por licitación y "sin usar en ninguna"; cada fila indica el requisito que cubre y el vencimiento contra la apertura |
| `#/empresa` y `#/empresa/:id` | **Mi empresa**: varias empresas o sociedades, con sus datos, sus documentos y lo que piden sus pliegos |
| `#/onboarding` y `#/onboarding/:paso` | **Onboarding**: es la pantalla de entrada al abrir el link, con los pasos cerrados; guía de 8 pasos (datos de la empresa, documentos, subir el pliego, resumen, requisitos, oferta, revisión, presentar). Cada paso dice qué hacer, qué información y qué documentos hacen falta, y se tilda solo según lo cargado (salvo "revisar el resumen" y "cargar la oferta", que se marcan a mano). Cada paso se despliega justo debajo de su título (uno abierto a la vez). Se elige solo la empresa; los pasos 4 a 8 siguen su primera licitación sin presentar |

## Diseño

- **Idea central:** trazabilidad. Todo lo que el sistema afirma se puede abrir y ver el párrafo del pliego del que salió.
- **Tono:** documento legal sobrio. Newsreader (serif) en titulares, Inter en la interfaz, JetBrains Mono en folios.
- **Color:** fondo papel `#f4f2ec`, azul marino `#1d3a63` como único acento; verde, ámbar y rojo solo para estado. Modo oscuro automático. Responsive.

## Lo que es simulado

- Los datos de empresa, biblioteca y valores de la oferta son inventados. Se guardan solo en el navegador.
- El checklist del caso de referencia está cargado a mano desde la lectura del pliego; **subir archivos nuevos solo simula** el análisis.
- Las plantillas son modelos de partida: hay que revisarlas con asesoría legal antes de firmar.
- Los plazos en días hábiles no descuentan feriados.
- El pliego se imprime desde el navegador; el PDF paginado con original y copia lo generaría la versión real.
- Los documentos técnicos (planos, memoria, organigrama) son esquemas de ejemplo, no proyectos.

## Versión real (propuesta, no construida)

- **Stack:** Supabase (Postgres + Auth + Storage) + React/TypeScript + Netlify, como administraNET y el Tablero.
- **Modelo de datos:** `empresa`, `documento_biblioteca` (con `vence`), `licitacion` (con `tipo` y `parametros`), `archivo`, `requisito` (carpeta, grupo, fuente con artículo, página y texto), `oferta`, `garantia`, `paquete`.
- **Lectura del pliego:** función en servidor que extrae el texto del PDF y llama a la API de Claude con salida estructurada (requisitos, parámetros, fechas, garantías) y la cita textual de cada uno. Lo que no se puede citar no se muestra como dato. Extracción de texto probada con `pdfjs-dist` sobre los 4 PDF de referencia (93, 14, 3 y 19 páginas, todos con texto; no hizo falta OCR).
- **Armado:** plantillas en servidor; unión de PDFs con paginado y sellado; descarga por URL firmada.
- **Seguridad (ISO 27001):** pliegos, balances y declaraciones son documentos sensibles → bucket privado, RLS por empresa, sin datos reales en el front estático, registro de descargas.

## Tipos de licitación

Cada licitación tiene un **tipo** (`tid`) que decide su estructura: partes del sobre, controles de la Revisión, cronograma, pestaña Oferta, tareas del Seguimiento, portada del pliego y documentos. Se definen en `js/store.js` (concesión) y `js/tipos.js` (los demás).

| Tipo | Ejemplo cargado | Parte del sobre | Oferta | Presentación |
|---|---|---|---|---|
| Concesión de uso | Mangrullo (ENAPRO) | Antecedentes, oferta técnica, oferta económica | Canon mensual, inversión, indicadores financieros | Sobre único físico, original y copia |
| Licitación pública internacional de bienes (BID) | VUCE-564-LPI-B, escáneres de rayos X | Formularios y precios, elegibilidad, conformidad técnica, calificaciones | Precio por lote (CIP), calificación posterior con ventas, experiencia y capacidad | Sobre físico, original y 2 copias, límite 12:00 y apertura 13:30 |
| Comparación de precios de bienes (BID) | VUCE-643-CP-B, repuestos de ultrabooks | Cotización, documentación del proveedor, técnica | Precio por lote con impuestos y presupuesto del llamado | PDF único por correo, hasta 25 MB, con clave |
| Comparación de precios de servicios (BID) | VUCE-642-CP-S, mantenimiento de impresoras | Igual que bienes, más la descripción del servicio | Servicio mensual por 12 meses | PDF único por correo |

Lo que cambia por tipo:

- **Controles de la Revisión.** Concesión: piso del canon, inversión mínima, indicadores, garantía en dinero. Licitación internacional: lotes completos, validez de 120 días, ventas 1,6 veces el lote, experiencia, capacidad por lote. Comparación de precios: lotes completos, validez de 60 días, tamaño del archivo, forma de firma, documentos que descartan la cotización.
- **Plazos.** Se cuentan en días hábiles (concesión) o corridos (BID). Las consultas cierran 21 días antes (licitación internacional) o 7, 10 o 14 días antes (comparación de precios, según el llamado).
- **Seguimiento.** Las seis etapas tienen tareas propias con la cláusula del pliego: garantía de cumplimiento del 10 % en 28 días, convenio de contrato en 28 días, anticipo del 20 %, pagos por etapas, multas de 1 % por semana, recepción en 7 días hábiles.
- **UT o APCA.** Disponible en concesión y licitación internacional (suma un formulario, y el líder cumple el 60 % de cada requisito); no en comparación de precios.

Al subir archivos en **Nueva licitación** se elige el tipo (en la versión real se detectaría solo). El análisis de los tipos nuevos sigue simulado. El estudio de los pliegos está en [docs/tipos-de-licitacion.md](docs/tipos-de-licitacion.md).

## Pendiente de definir

- ¿Uso propio o producto para varios clientes? Decide si lleva multiempresa desde el día uno.
- Qué otros tipos de licitación sumar después de concesión (compra de bienes, obra, servicios).
- Si la lectura debe apoyarse además en un checklist revisado por una persona antes de mostrarse como definitivo.
- Nada de esto va a producción hasta que lo apruebes.
