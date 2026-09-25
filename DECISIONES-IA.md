# Registro de decisiones asistidas por IA

Bitácora de trazabilidad exigida por la consigna (UTN — Ingeniería y Calidad de Software,
Proyecto 1). Se registra **una entrada por decisión significativa**, según los criterios de
[`CLAUDE.md`](CLAUDE.md), que son los mismos que usa el frontend.

Las entradas se agregan **al final**, en orden cronológico. No se reescribe la historia: si una
decisión se revierte, se agrega una entrada nueva que la revierte y se enlaza a la anterior.

---

## Plantilla

Copiar y completar. Los campos vacíos se dejan como `—`, no se borran.

```markdown
## [AAAA-MM-DD] ID — Título corto de la decisión

- **Tarjeta / CR:** PA-xxx, SYS-xxx, CR-00x o "ninguna"
- **Herramienta:** (modelo y versión, ej. Claude Opus 5 vía Claude Code)
- **Autor/a que condujo la sesión:** nombre
- **Link a la conversación:** URL, o "no disponible (CLI)"

### Prompt
Transcripción del pedido (o su síntesis fiel si fue largo — indicar si está resumido).

### Respuesta / propuesta de la IA
Qué propuso, en qué alternativas se abrió.

### Decisión tomada
Qué se aceptó y qué se implementó realmente.

### Qué se descartó y por qué
Lo más importante de la entrada. Alternativas evaluadas y motivo del rechazo.

### Modificaciones sobre lo generado
Qué hubo que corregir, ajustar o reescribir a mano.

### Impacto
Archivos, migraciones, endpoints, tests tocados.

### Verificación
Cómo se comprobó que funciona. Qué quedó **sin** verificar.
```

---

# Entradas

## [2026-09-18] PA-024 — Presentación del producto como Value Object en el backend

- **Tarjeta / CR:** PA-024 (CR-002 / US-02; reglas definidas en PA-023)
- **Herramienta:** Claude Opus 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible

> Parte de esta decisión se modificó el 2026-09-22: ver
> [la entrada del envase](#2026-09-22-pa-024--presentación-con-envase-de-catálogo-el-pack-sale-de-la-presentación).

### Prompt
Síntesis: implementar en el backend el plan `plan_CR002_backend.md` (Presentación como Value
Object, persistida en `producto`, validada en alta y modificación y devuelta en las consultas),
preguntando antes de cualquier cambio y trabajando en la rama
`PA-024-Implementar-Presentacion-en-backend-CR-002`.

### Respuesta / propuesta de la IA
Relevó el código contra el plan (escrito sobre `6538073`; `develop` estaba en `2ffe47d`) y
confirmó que el alta, la modificación, el mapper y los DTO no habían cambiado. Encontró dos
problemas en el plan y los planteó antes de implementar:
- El `CHECK` de contenido del plan dejaba pasar una dimensión sin magnitud (y al revés): con un
  NULL la expresión da UNKNOWN y MySQL lo toma como válido. Lo comprobó en el MySQL 8.0.46 local.
- Con `enableImplicitConversion` en `main.ts`, el DTO del plan aceptaba `"500"` como 500 y `true`
  como 1 (quedaba "1 ml"), contra la aclaración A1 del plan (tipos equivocados → `VALIDACION_DTO`).

### Decisión tomada
- Value Objects `Medida` (reglas R1 a R4 y normalización N1/N2 de PA-023) y `Presentacion`.
- Excepciones de dominio `PRESENTACION_INVALIDA` y `PRESENTACION_REQUERIDA` (400).
- Obligatoria en el alta, no se puede quitar, y los productos anteriores siguen siendo editables
  sin cargarla. Marcado como **BREAKING CHANGE**: el formulario actual no la envía, así que
  conviene mergear junto con la tarjeta del front.
- `CHECK` corregido: las ramas con valor exigen `IS NOT NULL`.
- Tipos estrictos en el DTO de presentación: un `@Transform` conserva el valor original del JSON
  (solo en esos campos), y `@IsObject` rechaza arrays.
- La entrada de este registro iba a ir en la descripción del PR porque el archivo no existía en el
  backend; el 2026-09-22 el equipo decidió crearlo.

### Qué se descartó y por qué
- **El `CHECK` tal como estaba en el plan:** no impedía guardar datos incompletos.
- **Dejar la conversión implícita global en la presentación:** aceptaba en silencio tipos
  equivocados (`true` → "1 ml"). El resto de la API no se tocó.
- **Presentación opcional en el alta hasta que esté el front:** contradice PA-023 §5.
- **Commitear el plan en la rama:** el usuario lo dejó fuera del repo.

### Modificaciones sobre lo generado
El equipo eligió en cada caso la opción recomendada. El pack de esta versión (R5, R6 y
`presentacionUnidadesPorPack`) se eliminó el 2026-09-22.

### Impacto
Ver la entrada del 2026-09-22, que describe el estado final de los archivos.

### Verificación
En esta versión: `tsc` sin errores, 50 suites y 261 tests en verde (línea base: 46 y 124); la
migración se aplicó, se revirtió y se volvió a aplicar en la base local; 8 `UPDATE` inválidos
fallaron con el error 3819 dentro de un `ROLLBACK`; `schema:log` sin cambios de presentación.
La prueba manual quedó pendiente por el cambio de requerimiento.

---

## [2026-09-22] PA-024 — Presentación con envase de catálogo; el pack sale de la presentación

- **Tarjeta / CR:** PA-024 (CR-002 / US-02). Modifica PA-023 y la entrada del 2026-09-18.
- **Herramienta:** Claude Opus 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible

### Prompt
Síntesis: cambió el requerimiento. La presentación pasa a estar formada por **envase** (por
ejemplo "Botella", "Bolsa", "Bolsón"), **valor** y **unidad de medida** ("Botella 500 ml"), y los
envases no están fijos: los tienen que poder crear los usuarios. Pensar la mejor solución con el
código actual, sin implementar, y después ejecutarla. La tabla nueva se tiene que llamar
"envasePresentacion", en la convención de nombres más consistente con los catálogos existentes.

### Respuesta / propuesta de la IA
Propuso un catálogo `EnvasePresentacion` armado igual que Marca (alta, modificación, baja lógica,
búsqueda, selector y auditoría) y mantener la presentación como Value Object, que referencia al
envase por id. Preguntó por el pack, la obligatoriedad de los tres campos, la carga inicial de
envases y la estrategia de migración.

### Decisión tomada
- Tabla `envase_presentacion` en snake_case, como `movimiento_stock` o `historial_precio`. La
  entidad es `EnvasePresentacion` y la ruta `/api/envase-presentacion`.
- En `producto`, una sola columna `envase_presentacion_id` con su FK y su índice (una relación = una
  columna), más `presentacionDimension` y `presentacionMagnitudBase`. Un único `CHECK`: las tres
  columnas van juntas y el contenido respeta los rangos.
- Presentación = envase + `Medida`, con los tres campos obligatorios. Entrada:
  `{ envaseId, cantidad, unidad }`. Salida:
  `{ envase: { id, denominacion }, contenido: { cantidad, unidad }, texto: "BOTELLA 500 ml" }`.
- El servicio valida que el envase exista y esté activo (404 si no), igual que con marca y línea.
- El pack sale de la presentación: se eliminan R5, R6 y la columna del pack. `utilizaPack` y
  `cantidadPorPack` siguen como estaban.
- Catálogo: denominación única (incluidos los eliminados, como Marca), guardada en MAYÚSCULAS; no se
  puede borrar un envase usado por productos activos (409); los de sistema no se editan.
- Envases iniciales en el seed de familia de producto: Botella, Bolsa, Bolsón, Caja, Lata, Frasco,
  Paquete y Sachet.
- La migración de PA-024, que todavía no se había commiteado, se reescribió (revertida en la base
  local, editada y vuelta a correr) en lugar de sumar otra encima.
- Para la denominación automática, que no se implementó, se acordó que al nombre se le agregue la
  presentación completa, con envase: "Aceite de girasol Natura Botella 900 ml".

### Qué se descartó y por qué
- **El envase como texto libre:** "Botella", "botella" y "Botellas" quedarían como envases
  distintos, y renombrar no se reflejaría en los productos.
- **Una lista fija de envases:** el requerimiento pide que los creen los usuarios.
- **Un catálogo de presentaciones completas:** obliga a cargar cada combinación y no evita "Botella
  0 ml". Solo el envase necesita identidad; el contenido sigue validándose con reglas.
- **Mantener el pack como opcional, o modelarlo como un envase "Pack":** el requerimiento define
  tres partes; el pack sigue en sus columnas actuales hasta otra tarjeta.
- **Envase opcional:** "500 ml" sin envase no cumple la definición nueva.
- **Una segunda migración encima:** quedaban dos migraciones para una sola tarjeta sin publicar.
- **Nombre de tabla en camelCase (`envasePresentacion`):** solo `usuarioRol` sigue esa forma; el resto
  de las tablas usa snake_case.

### Modificaciones sobre lo generado
- La primera prueba manual encontró dos errores del agente: el adaptador del envase no inyectaba
  `DataSource`, que el decorador `@Transactional` necesita (500 en el alta), y el selector usaba
  `DenominacionBusquedaDto`, que exige `denominacion` (400 sin filtro). Se corrigieron con un
  comentario en el adaptador y un DTO propio con el filtro opcional. Los tests unitarios no los
  detectaban porque mockean el repositorio y no pasan por el `ValidationPipe`.
- El script de prueba hizo un `PUT` sobre el producto 1, que recalculó su precio de 4406.55667 a
  1500 por el recálculo costo × margen que ya existía. El agente había anunciado que el precio no
  iba a cambiar. Con autorización del usuario se restauró por SQL, sin registro en el historial, y
  el script se corrigió para no repetirlo.
- En el documento de decisión de modelado se incorporaron las respuestas del equipo (pack = lo que
  se vende, máximos y unidades suficientes, obligatoriedad, avisar y permitir los cambios con stock)
  y se sacaron sus comentarios.

### Impacto
- Nuevo módulo `src/modules/gestion-productos/envase-presentacion/` (entidad, DTO, repositorio,
  política de eliminación, servicio, controller, módulo y `envase-presentacion.service.spec.ts`).
- Value Objects `producto/domain/value-objects/medida.vo.ts` y `presentacion.vo.ts`, con sus specs.
- Excepciones `common/exceptions/presentacion-invalida.exception.ts` y
  `presentacion-requerida.exception.ts`.
- Producto: entidad, servicio, mapper, DTO (`presentacion.dto.ts`, `create-producto.dto.ts`,
  `producto.dto.ts`, `get-producto.dto.ts`), repositorio (joins al envase y
  `existsProductosActivosByEnvasePresentacion`), validador de entidades relacionadas y módulo.
- Migración `src/migrations/1789740326260-AgregarPresentacionProducto.ts`.
- Seed: `seed-familia-producto.service.ts` y `.module.ts`, `seed-all.module.ts`.
- `app.module.ts` e `index.ts` registran el módulo y la entidad.
- Tests nuevos o extendidos: VO, entidad, servicio, HTTP, DTO con la conversión de `main.ts` y
  mapper.
- **Contrato:** cambio incompatible en el alta (`POST /api/producto` exige `presentacion`).

### Verificación
- `tsc` sin errores; 51 suites y 259 tests en verde.
- Base local: migración aplicada; `schema:log` solo muestra diferencias previas en
  `historial_precio`; dentro de un `ROLLBACK`, 5 `UPDATE` inválidos fallaron con 3819, uno con
  envase inexistente falló por la FK (1452) y el válido entró.
- El backend arranca y resuelve la dependencia circular entre producto y envase; Swagger muestra
  el contrato nuevo.
- Prueba manual contra el backend local: 18 de 20 verificaciones OK (seed, alta de envase, envase
  repetido, pasos 2 a 7, envase inexistente, presentación sin envase, `"500"` como texto, quitar la
  presentación y borrar un envase en uso). Las dos fallas son ajenas a PA-024:
  - `search-by-rapido` responde 400 con cualquier valor explícito de `exacto`: su `@Transform` choca
    con `enableImplicitConversion`. Es previo y queda en otra tarea.
  - El precio del producto 1 cambió por el recálculo de la edición, también previo.
- **Pendiente:** la tarjeta del frontend (formulario con envase y ABM de envases) y actualizar PA-023
  en el tablero, porque este cambio elimina R5 y R6.

---

## [2026-09-22] PA-031 — Denominación automática al alta del producto

- **Tarjeta / CR:** PA-031 (CR-005 / US-05). Depende de PA-024, PA-001, PA-009; bloquea PA-032.
- **Herramienta:** Claude Sonnet 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

> La decisión de dejar el envase afuera de la denominación se revirtió el mismo día: ver
> [la entrada de corrección](#2026-09-22-pa-031--el-envase-va-incluido-en-la-denominación-automática).

### Prompt
Implementar CR-005 tal como está redactada en la tarjeta: al crear un Producto con Marca, Línea y
Presentación válidas, generar automáticamente la Denominación como "Marca + Línea + Presentación";
permitir que el usuario la reemplace manualmente antes de guardar y que el backend conserve ese
valor; que la generación ocurra sólo en el alta (un cambio posterior de Marca, Línea o Presentación
no la regenera); y cubrir con tests la generación inicial, la edición manual y la ausencia de
regeneración posterior. Se pidió preguntar antes de cualquier decisión.

### Respuesta / propuesta de la IA
Antes de tocar código, relevó `CreateProductoDto`, `ProductoService`, la entidad `Producto` y los
Value Objects `Presentacion`/`Medida`, y encontró tres ambigüedades reales en la tarjeta que
planteó antes de implementar:
- El ejemplo funcional de la tarjeta ("Coca-Cola Gaseosas 500 ml") no incluye el envase, mientras
  que `Presentacion.texto()` ya arma "BOTELLA 500 ml" (envase + contenido, de PA-024). Sin definir
  esto, la denominación autogenerada podía no coincidir con el ejemplo de la tarjeta.
- La tarjeta no dice cómo distinguir "generar automáticamente" de "el usuario mandó una
  denominación manual": había que decidir entre inferirlo de que el campo venga vacío, o agregar un
  campo explícito.
- La denominación es única en todo el sistema (`validarDenominacionUnica`); dos productos con la
  misma Marca+Línea+Presentación colisionan al autogenerar, y la tarjeta no dice qué hacer en ese
  caso.

### Decisión tomada
- La denominación autogenerada **no incluye el envase**: `Marca + Línea + contenido` (ej.
  "COCA-COLA GASEOSAS 500 ml"), usando `presentacion.contenido.texto()` en vez de
  `presentacion.texto()`. Coincide literal con el ejemplo de la tarjeta.
- Se agregó un campo explícito `generarDenominacionAutomatica?: boolean` a `CreateProductoDto` (no
  a `UpdateProductoDto`) en vez de inferir la intención de que `denominacion` venga vacío. Con el
  flag en `true`, `denominacion` deja de validarse en el DTO (`@ValidateIf`) y cualquier valor que
  llegue igual se ignora: el backend siempre genera y sobrescribe. Con el flag en `false` o ausente,
  el comportamiento es exactamente el de antes (denominación manual obligatoria) — cero cambios para
  quien no use el flag.
- Colisión de unicidad: se resuelve con el `409` que ya lanza `validarDenominacionUnica`, sin lógica
  de desambiguación nueva. El alta falla y el usuario tiene que mandar una denominación manual.
- La generación se implementó como método estático de dominio,
  `Producto.generarDenominacionAutomatica(marca, linea, presentacionTexto)`, invocado sólo desde un
  flujo nuevo de `ProductoService` (`validarYPrepararCreacionConDenominacionAutomatica`) que resuelve
  Marca, Línea y el envase de la Presentación *antes* de armar el string, y nunca desde `update()` —
  así que un cambio posterior de Marca, Línea o Presentación no la toca.

### Qué se descartó y por qué
- **Incluir el envase en la denominación:** es lo que ya arma `Presentacion.texto()`, pero no
  coincide con el ejemplo literal de la tarjeta ("Coca-Cola Gaseosas 500 ml", sin "Botella").
- **Inferir la generación de que `denominacion` venga vacío/ausente:** funciona, pero es implícito;
  con un campo explícito el contrato HTTP dice la intención en vez de inferirla de una ausencia, y
  además deja mandar `denominacion` junto con el flag sin ambigüedad sobre qué gana (gana el flag).
- **Auto-desambiguar una colisión de unicidad (ej. sufijo automático):** no lo pide la tarjeta y
  agrega una regla de negocio nueva (¿qué sufijo, hasta cuándo reintentar) sin especificación.
- **Reordenar `validarYPrepararCreacion` para todos los casos:** se probó separar el flujo con flag
  en un método aparte en vez de intercalar la generación en el flujo existente, para no tocar el
  orden de validaciones (y por lo tanto los mensajes de error) del alta manual, que ya tiene tests
  cubriendo ese orden.

### Modificaciones sobre lo generado
Ninguna: el equipo confirmó las tres preguntas (envase afuera, flag explícito, 409 en colisión) tal
como se propusieron, sin cambios sobre lo implementado.

### Impacto
- `producto/dto/create-producto.dto.ts`: `denominacion` pasa a `string | undefined` con
  `@ValidateIf((o) => o.generarDenominacionAutomatica !== true)`; nuevo campo
  `generarDenominacionAutomatica?: boolean`. `UpdateProductoDto` no se tocó (sigue exigiendo
  denominación siempre).
- `producto/domain/entities/producto.entity.ts`: nuevo método estático
  `generarDenominacionAutomatica`.
- `producto/application/services/producto.service.ts`: `validarYPrepararCreacion` deriva al nuevo
  flujo `validarYPrepararCreacionConDenominacionAutomatica` cuando el flag es `true`; sin cambios en
  el flujo manual salvo dos `!` de TypeScript (el campo pasó a opcional en el tipo).
- `producto/mappers/producto.mapper.ts`: `generarDenominacionAutomatica` se excluye explícitamente
  al mapear el DTO a la entidad (en alta y en update), para que no se filtre como propiedad suelta.
- **Contrato:** cambio no incompatible — `denominacion` se afloja de obligatoria a condicional;
  nadie que no mande el flag nuevo nota un cambio.
- Tests nuevos en `producto.service.spec.ts` (`describe('denominación automática (CR-005)')`):
  generación inicial, denominación manual ignorada con el flag en `true`, denominación manual
  conservada con el flag en `false`/ausente, y ausencia de regeneración en `update()`.

### Verificación
- `tsc --noEmit`: sin errores.
- `jest` (suite completa): 318 tests, 315 en verde (línea base antes de este cambio, en la misma
  rama: 314 tests, 311 en verde). Los 3 tests en rojo y la suite `producto.controller.spec.ts` que no
  carga son **previos a esta tarjeta**: se confirmó corriendo la suite completa con `git stash` sobre
  el estado sin esta tarjeta y falla exactamente igual (bug del mock de transacción en 3 tests de
  `modificación` de `producto.service.spec.ts`, y un problema de versión de
  `@nestjs/swagger`/`PartialType` ajeno a este cambio). El test nuevo de "no regenera en `update()`"
  se armó con un `precio` explícito en el fixture para no pisar ese camino roto.
- **Pendiente:** prueba manual contra el backend local (no se levantó la app en esta sesión) y la
  tarjeta del frontend que consume el flag nuevo.

---

## [2026-09-22] PA-031 — El envase va incluido en la denominación automática

- **Tarjeta / CR:** PA-031 (CR-005 / US-05). Corrige la entrada anterior de este mismo día
  ([Denominación automática al alta del producto](#2026-09-22-pa-031--denominación-automática-al-alta-del-producto)).
- **Herramienta:** Claude Sonnet 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt
El usuario marcó como incorrecta la decisión de dejar el envase afuera de la denominación
autogenerada: con Marca+Línea+contenido solamente, una Coca-Cola de 500 ml en botella y otra en
lata generan el mismo string y, como la denominación es única en todo el sistema, la segunda alta
choca con una colisión que no es un duplicado real. Pidió corregirlo, aclarando que no hace falta
que el resultado coincida literalmente con el ejemplo de la tarjeta de Trello.

### Respuesta / propuesta de la IA
Confirmó el caso: `Producto.generarDenominacionAutomatica` recibía `presentacion.contenido.texto()`
("500 ml", sin envase) en vez de `presentacion.texto(envase.denominacion)` ("BOTELLA 500 ml"). Se
corrigió el único call site, en `ProductoService.validarYPrepararCreacionConDenominacionAutomatica`.

### Decisión tomada
- La denominación automática pasa a ser `Marca + Línea + Presentación completa (envase + contenido)`,
  ej. `"COCA-COLA GASEOSAS BOTELLA 500 ml"`. Revierte puntualmente la decisión "sin envase" de la
  entrada anterior; el resto de esa entrada (flag explícito, `409` en colisión, generación sólo en
  el alta) no cambia.
- Se agregó un test nuevo que prueba explícitamente el caso que motivó la corrección: misma
  Marca+Línea+contenido, envase distinto (botella vs. bolsa) → dos denominaciones distintas, no hay
  colisión.

### Qué se descartó y por qué
- **Dejar el ejemplo de la tarjeta como criterio de aceptación literal:** el usuario aclaró que no
  hace falta que coincida; prevalece la regla de negocio real (no perder la distinción entre
  envases) por sobre el string exacto del ejemplo funcional.

### Modificaciones sobre lo generado
Ninguna: cambio de una línea (el argumento que arma el string) más su comentario, sin tocar el resto
del flujo, los DTO ni el mapper.

### Impacto
- `producto/domain/entities/producto.entity.ts`: comentario de `generarDenominacionAutomatica`
  actualizado; la firma del método no cambió.
- `producto/application/services/producto.service.ts`: el call site pasa
  `presentacion.texto(envase.denominacion)` en vez de `presentacion.contenido.texto()`.
- `producto.service.spec.ts`: las 4 cadenas esperadas de la CR-005 pasan a incluir el envase (ej.
  `"COCA-COLA GASEOSAS BOTELLA 500 ml"`), y se agregó un quinto test:
  "el envase distingue productos con igual Marca+Línea+contenido (botella vs. lata no colisionan)".
- **Contrato:** ninguno nuevo — sigue siendo el mismo campo `generarDenominacionAutomatica`, sólo
  cambia el contenido del string que genera.

### Verificación
- `tsc --noEmit`: sin errores.
- Suite completa: 322 tests, 319 en verde. Los 3 en rojo son los mismos bugs preexistentes ya
  identificados en la entrada anterior, sin relación con este cambio.
- Se sumaron 3 tests HTTP en `producto.http.spec.ts` (contra el `ValidationPipe` real, sin mockear)
  para blindar el flag `generarDenominacionAutomatica` ante una regresión de validación del DTO.
- Prueba manual end-to-end repetida contra un backend local (docker-compose + MySQL 8) con el string
  corregido: Marca+Línea+contenido igual con envase distinto (botella vs. lata) generó dos
  denominaciones distintas sin colisionar; repetir exactamente el mismo combo (mismo envase incluido)
  sí dio `409` (duplicado real); alta manual sin el flag, denominación manual ignorada con el flag en
  `true`, y ausencia de regeneración en un `PUT` posterior siguen funcionando igual que antes.

## [2026-09-23] PA-020 — Búsqueda de productos: booleanos de query, búsqueda rápida solo por código y filtro acumulable

- **Tarjeta / CR:** PA-020 (rama `testing`); hallazgos 6 y 7 del informe de testing del equipo
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: analizar el checkbox "Exacto" de la pantalla de productos (buscador rápido del header y
filtro lateral). El header "explotaba" al clickearlo; en el filtro lateral, al destildarlo y buscar
"DEMO", no traía nada. Tras el análisis, el equipo decidió que la búsqueda rápida es **únicamente
por código** y que el filtro lateral es **acumulable (AND)**, y pidió documentarlo acá y en el
`DECISIONES-IA.md` del front.

### Respuesta / propuesta de la IA

Causa raíz, reproducida contra el server local y aislada con `class-transformer` 0.5.1:

- `main.ts` configura el `ValidationPipe` global con `enableImplicitConversion: true`. Esa
  conversión corre **antes** del `@Transform` y convierte con `Boolean(...)`:
  `Boolean("false") === true`. El `@Transform` recibe `true` (booleano) para `"true"` y para
  `"false"`.
- `SearchProductoRapidoDto.exacto`: el `@Transform` solo aceptaba strings y devolvía `undefined`,
  con lo que `@IsBoolean` rechazaba con **400 en todos los casos**.
- `SearchProductoPaginationWithDto.codProveedorExacto`: aceptaba `true` booleano, así que `false`
  terminaba en `true` y la búsqueda **siempre era exacta**.
- `SearchProductoPaginationWithDto.conStock`: mismo `@Transform` que `exacto`, siempre `undefined`,
  así que el filtro nunca se aplicaba.
- `producto.http.spec.ts` armaba el `ValidationPipe` **sin** `enableImplicitConversion`, por eso
  los tests no lo detectaban.
- Semántica: `findBy` unía denominación, código y código de referencia con `OR`, y `findByRapido`
  no exacto buscaba también en `denominacion`.

Propuso un decorador `@ToBoolean()` que lee el valor crudo `obj[key]` y, además, corregir la
semántica de las queries según lo que decidiera el equipo.

### Decisión tomada

- Nuevo `@ToBoolean(valorPorDefecto?)` en `src/modules/common/decorators/to-boolean.decorator.ts`.
  Acepta `true`/`false`, `'true'`/`'false'`, `'1'`/`'0'` y `1`/`0`; ausente o vacío devuelve el
  valor por defecto. Se aplica a `exacto`, `codProveedorExacto`, `codReferenciaExacto` y `conStock`.
- `findByRapido` (búsqueda rápida): **solo por código**. Exacto: `codigoProveedor = :codigo OR
  codigoReferencia = :codigo`. No exacto: `LIKE` sobre esos dos campos. Sin `denominacion`.
- `findBy` (filtro lateral): **acumulable**. Cada criterio presente se agrega con su propio
  `andWhere`.
- `producto.http.spec.ts`: el `ValidationPipe` replica el de `main.ts`, y hay 5 tests nuevos que
  verifican que `exacto`, `codProveedorExacto` y `conStock` lleguen al servicio con el valor
  correcto para `"true"`, `"false"` y ausente.

### Qué se descartó y por qué

- **Quitar `enableImplicitConversion` del pipe global:** otros DTOs dependen de él para convertir
  números de la query. El cambio afectaba a todo el back para arreglar un problema acotado.
- **Resolverlo en el front mandando `1`/`0`:** tapa el bug para un solo cliente. Swagger o
  cualquier otro consumidor seguirían recibiendo `false` como `true`.
- **Copiar un `@Transform` corregido en cada DTO:** ya había tres variantes distintas del mismo
  parser, y las tres fallaban por la misma razón. Un único decorador evita que se vuelva a divergir.
- **Mantener `denominacion` en la búsqueda rápida:** el equipo definió que es solo por código.
- **Mantener el `OR` en el filtro:** devolvía la unión de los criterios, no la intersección.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- Nuevo: `src/modules/common/decorators/to-boolean.decorator.ts`.
- Modificados: `src/modules/gestion-productos/producto/dto/search-producto-rapido.dto.ts`,
  `.../dto/search-producto-pagination-with.dto.ts`,
  `.../infraestructure/repositories/producto.persistence-adapters.ts` (`findBy`, `findByRapido`) y
  `.../application/controllers/producto.http.spec.ts`.
- Endpoints: `GET /producto/search-by-rapido` y `GET /producto/search-by`. La forma del contrato no
  cambia, pero sí los resultados: la búsqueda rápida ya no matchea por denominación y el filtro
  combina con `AND`.
- Front: manejo de errores en `consultar-producto.tsx`. Ver la entrada equivalente en el
  `DECISIONES-IA.md` del front, que además registra como deuda la paginación y el foco de esa
  pantalla.
- Nuevo `CLAUDE.md` en este repo, con las mismas reglas de registro que el front.

### Verificación

- `jest`: 49 suites y 185 tests en verde (antes 180). Los 5 tests nuevos se corrieron también sin
  el fix de los DTOs: 4 fallan, lo que confirma que detectan el bug.
- En vivo contra el server local, con el usuario `administrador@gmail.com`:
  - `search-by-rapido`: 200 con `exacto` en `true` y en `false`. `ACE-001` exacto trae 1; `ACE`
    exacto trae 0; `ACE` no exacto trae `ACE-001`; `aceite` no exacto trae 0 (no busca por
    denominación).
  - `search-by`: `codigoProveedor=ACE&codProveedorExacto=false` trae `ACE-001` (antes 0);
    `denominacion=ACEITE&codigoProveedor=HAR` trae 0 (antes, con `OR`, habría traído 2);
    `denominacion=HARINA&codigoProveedor=001&conStock=true` trae `HAR-001`.
- ESLint del back no corre: la configuración falla en `validateRulesConfig`. Es preexistente y no
  lo generan estos cambios.
- **Sin verificar:** `conStock=true` excluyendo productos sin stock (todos los datos semilla tienen
  stock), y la UI en el navegador.

### Deuda técnica detectada y no resuelta

- `incluirEliminados` repite el patrón roto (`value === 'true' || value === true`) en
  `common/dto/busquedas/pagination-with-denominacion.dto.ts`,
  `common/dto/denominacion-empresa-operador.dto.ts` y `gutil/localidad/dto/search-localidad.dto.ts`:
  `false` llega como `true`. Se corrige con `@ToBoolean()`, pero queda fuera del alcance de
  producto.
- `codReferenciaExacto` se valida en el DTO, pero `ProductoController.search` no lo desestructura
  ni lo pasa al servicio; la referencia siempre se busca con `LIKE`.
- El seed de usuarios crea `admin@gmail.com` con contraseña `admin`, que no pasa la validación de
  login (6 a 20 caracteres). No se modificó: el equipo usa la cuenta `administrador`.

## [2026-09-24] Integración — `testing` al día con `develop`, `main` y el PR #31 (PA-029)

- **Tarjeta / CR:** ninguna propia; preparación de PA-053 y PA-055. Integra PA-029 (CR-004), PA-051, PA-024 y PA-031
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: traer a `testing` los últimos cambios de Martina Pineda en `develop` y el PR #31 de
Ignacio Fumero (PA-029, todavía abierto), teniendo en cuenta que `develop` no contenía `main`;
analizar el impacto, mergear todo y crear las ramas de PA-053 y PA-055 desde `develop`, al día con
`develop` y con `testing`.

### Respuesta / propuesta de la IA

- `main` contra `develop`: los 5 commits de `main` que faltaban en `develop` son todos merges de
  release; `git merge-tree` mostró que mergearlos **no cambia ningún archivo**. El impacto es solo
  de historia (que `develop`/`testing` "contengan" a `main`).
- `develop` y `main` del back están protegidas en GitHub: no se puede pushear directo, todo entra
  por PR.
- Conflictos de `testing` ← `develop`: los dos lados habían sumado cosas en los mismos lugares
  (`SuperLinea` en `testing` y `EnvasePresentacion` en `develop` en los módulos del seed; mocks
  nuevos en `producto.http.spec.ts`; `DECISIONES-IA.md` creado por separado en cada rama).
- Conflicto con el PR #31: solo los imports de `search-producto-pagination-with.dto.ts`. Sus
  filtros por Línea y SuperLínea ya usan `andWhere`, compatibles con el filtro acumulable de PA-020.
- Conflictos semánticos que git no detecta: el spec del adapter de Ignacio esperaba la condición
  de denominación entre paréntesis (forma del viejo `OR`), y el fixture de presentación de
  `develop` armaba el producto con `lineaId`/`marcaId`, que `testing` ya había reemplazado por la
  relación.

### Decisión tomada

- Merges con `--no-ff`: `develop` → `testing`, `main` → `testing` y PR #31 → `testing`.
- Conflictos resueltos conservando ambos lados. En `DECISIONES-IA.md` se tomó el archivo de
  `develop` y la entrada de PA-020 quedó al final, por orden cronológico.
- Spec del adapter de PA-029: la condición de denominación se espera sin paréntesis, como la
  genera el filtro acumulable. El HTTP spec se adaptó a la nueva firma de `findBy`.
- Fixture de presentación: `linea: { id: 1 }` y `marca: { id: 1 }` en lugar de `lineaId`/`marcaId`.
- Ramas `PA-053-Actualizar-datos-de-visualizacion-en-detalles-del-producto` y
  `PA-055-Comprobar-soft-delete-de-la-lista-de-productos` creadas desde `origin/develop`, con
  `testing` mergeado.
- Base local: se aplicó la migración pendiente `AgregarPresentacionProducto1789740326260`, que
  trajo `develop`.

### Qué se descartó y por qué

- **Rebase de `testing` sobre `develop`:** reescribe commits ya pusheados a una rama compartida.
- **Crear las ramas de PA desde `testing`:** el equipo pidió que sean hijas de `develop`.
- **Revertir el filtro acumulable para que pase el spec de PA-029:** el `AND` es una decisión del
  equipo (PA-020) y el propio test de Ignacio describe "filtros restrictivos".
- **Dejar rotos los 3 tests de presentación:** se arreglaron en un segundo paso, a pedido del
  equipo (ver "Tests rotos y falsos positivos").
- **Mockear la transacción de historial en esos 3 tests:** ocultaría que el fixture no era
  realista. Un producto guardado siempre tiene el precio derivado de costo y margen.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- Merges en `testing`; `producto.persistence-adapters.spec.ts` (de PA-029), `producto.http.spec.ts`
  y `producto.service.spec.ts` ajustados.
- Las ramas de PA-053 y PA-055 incluyen el PR #31 aunque todavía no esté aprobado: cuando se abran
  sus PRs contra `develop`, van a arrastrar PA-029 y todo lo de `testing` si no se mergeó antes.

### Verificación

- `tsc --noEmit` sin errores después de cada merge.
- `jest` después de los merges: 55 suites, 333 de 336 tests en verde. Los 3 que fallaban
  (`ProductoService › presentación (CR-002) › modificación`) fallan igual en `origin/develop`
  (`0ca0f24c`), verificado en un worktree aparte: 3 fallidos y 30 en verde en ese spec. El error era
  `Cannot read properties of undefined (reading 'denominacion')`. Con el arreglo del fixture
  quedan 336 de 336.
- **Sin verificar:** la UI contra este back integrado.

### Tests rotos y falsos positivos

- **Los 3 tests de presentación** (y el error de test que arrastraba el PR #31, que eran esos
  mismos 3: en su rama sola daban 327 de 330). El fixture `productoGuardado` tenía costo 100 y
  margen 15 % pero no `precio`. Al editar, el precio "cambiaba" de 0 a 115 y el update tomaba el
  camino de la transacción con historial, que esos tests no mockean. Se agregó `precio: 115` al
  fixture y se quitó el comentario del test de CR-005 que lo atribuía a un "bug previo". El camino
  con cambio de precio ya tiene su propio test ("recalcula el precio y registra el cambio en el
  historial en una única transacción").
- **Tests que pasaban cuando deberían haber fallado:**
  - `producto.http.spec.ts` armaba el `ValidationPipe` sin `enableImplicitConversion`, a
    diferencia de `main.ts`: los booleanos de query "funcionaban" en el test y no en producción.
    Corregido en PA-020.
  - El borrado de producto no tenía ningún test: `mockRepository.remove` estaba declarado pero
    nadie lo ejercitaba. Por eso el soft delete roto desde `a07ce54f` (11/09) no se detectó. Se
    cubre en PA-055.
  - Los specs del adapter verifican las condiciones con `toHaveBeenCalledWith`, que no falla si
    se agrega o se quita una condición. Por ejemplo, quitar `producto.deletedAt IS NULL` de
    `findBy` no rompe ningún test. Se cubre en PA-055.
  - 40 tests del back son solo `should be defined` (el placeholder que genera Nest): pasan
    siempre y no prueban comportamiento. Quedan como deuda.

## [2026-09-24] PA-053 — Detalles del producto: responsable en el historial de precios y auditoría que muestra solo lo que existe

- **Tarjeta / CR:** PA-053. Revierte parcialmente lo descartado en PA-019 (mostrar el usuario del cambio de precio)
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)
- **Repos:** back y front; la misma entrada está en el `DECISIONES-IA.md` de cada uno.

### Prompt

Síntesis: el botón de información (la "I") muestra el último cambio pero no qué se cambió, y el
historial de precios (el reloj) no muestra quién hizo cada cambio. Analizar qué guarda la
auditoría y si se puede rastrear qué campo cambió. El equipo decidió que PA-053 **se limita a
mostrar mejor lo que ya existe** y a que se vea como corresponde, sin agregar un registro de
cambios por campo.

### Respuesta / propuesta de la IA

- La auditoría de producto son columnas de la misma fila: `createdAt`, `updatedAt`, `deletedAt` y
  los usuarios de creación, última modificación y baja. Cada edición pisa a la anterior, así que
  no se puede saber qué campo cambió. El módulo `gestion-sistema/auditoria` es un esqueleto del
  CLI de Nest sin implementar. Los únicos rastros por campo son `historial_precio` y
  `movimiento_stock`.
- `historial_precio.usuario_id` ya se guardaba (en la base local, el cambio del producto 1 es de
  Jenifer Lopez), pero `findHistorialPrecios` no cargaba la relación y devolvía solo el id.
- En el modal de auditoría: `updatedAt` se completa ya al crear, así que el bloque "Actualizado"
  aparecía siempre, con "No especificado"; el ID para Root dependía de un `rolId` que el token no
  trae, y por eso hacía una request al backend en cada apertura; y `mapProductoToDto` respondía 500
  si el producto no tenía usuario creador.

### Decisión tomada

- Back: `findHistorialPrecios` carga `usuario` y devuelve `usuarioDenominacion` (null si no hay
  usuario), sin quitar `usuarioId`. `mapProductoToDto` tolera un producto sin creador.
- Front: columna "Responsable" en el historial de precios ("—" si no hay). En el modal de
  auditoría, el bloque pasa a llamarse "Última modificación" y solo aparece si hubo usuario de
  modificación o una fecha distinta a la de creación. El ID para Root se decide con
  `getRoles().includes(Rol.ROOT)`.

### Qué se descartó y por qué

- **Registrar los cambios por campo (tabla de bitácora con campo, valor anterior y nuevo):** lo
  descartó el equipo para esta tarjeta. Cambia el modelo y el esquema, y PA-053 es de
  visualización.
- **Mantener lo descartado en PA-019 (mostrar solo el id):** ese descarte se basaba en que el
  backend no devolvía el nombre. Ahora lo devuelve.
- **Resolver el nombre del usuario en el front con otra request:** una consulta extra por cada fila,
  cuando el backend ya tiene la relación.
- **Ocultar "Última modificación" comparando solo `usuarioUpdated`:** los registros viejos pueden
  tener fecha de modificación sin usuario. Por eso también se compara la fecha.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- Back: `producto.service.ts` (`findHistorialPrecios`), `dto/historial-precio.dto.ts`,
  `gestion-sistema/auditoria/mappers/auditoria.mapper.ts`, `producto.service.spec.ts` y el nuevo
  `auditoria.mapper.spec.ts`.
- Front: `interfaces-historial-precios.tsx`, `modales/historial-precios-modal.tsx` y su test,
  `herramientas/reutilizables/informacion-auditoria.tsx` (modal genérico, lo usan también
  clientes, proveedores, etc.) y el nuevo `informacion-auditoria.test.tsx`.
- Contrato: `GET /producto/:id/historial-precios` suma `usuarioDenominacion`, y no se quita nada.

### Verificación

- Back: tests del service y del mapper en verde (39 en esos specs). El test del historial
  verifica que se pida la relación `usuario` y que la respuesta traiga el nombre, o `null`.
- Front: `vitest run` con 16 archivos y 57 tests en verde. `tsc` sin errores nuevos (125, igual que
  testing). El test "sin modificaciones" falla con el código anterior, porque el bloque aparecía
  siempre.
- **Sin verificar:** el modal en el navegador.

### Deuda técnica detectada y no resuelta

- **Fechas de creación y modificación adelantadas 3 horas.** MySQL (contenedor en UTC) genera
  `createdAt` y `updatedAt` con `CURRENT_TIMESTAMP` en UTC, pero TypeORM está configurado con
  `timezone: '-03:00'` y los lee como si fueran hora local. `deletedAt` lo carga la app y queda
  bien. Verificado en la base local: a las 00:00 locales, una baja dejó `deletedAt` 00:00 y
  `updatedAt` 03:00. Afecta a todas las entidades con `@CreateDateColumn` o `@UpdateDateColumn`
  (en el modal, "Creado" y "Última modificación"). No se corrigió porque cambia el manejo de
  fechas de todo el sistema: queda pendiente de decisión del equipo.

## [2026-09-24] PA-055 — Soft delete de productos: la baja se guarda y los eliminados se pueden consultar

- **Tarjeta / CR:** PA-055
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)
- **Repos:** back y front; la misma entrada está en el `DECISIONES-IA.md` de cada uno.

### Prompt

Síntesis: al eliminar un producto no pasa nada. Analizar qué guarda el soft delete y por qué no se
refleja en el front. Agregar un booleano al lado de filtrados/mostrados para ver los productos
eliminados, y que en la "I" de esos productos aparezca "Eliminado por" en rojo, con los mismos
datos que los otros bloques.

### Respuesta / propuesta de la IA

- **Back:** `ProductoService.remove` marcaba `deletedAt` y `usuarioDeleted` y después llamaba a
  `repository.remove()`. El adapter rechaza con 404 "Entidad ya eliminada." todo producto que ya
  trae `deletedAt`, así que la baja nunca se guardaba. Reproducido en vivo: `DELETE /producto/7`
  respondía 404 y la fila quedaba intacta. El bug está desde `a07ce54f` (11/09). En envase y en el
  resto de las entidades, el que marca la baja es el adapter.
- **Front:** la alerta del 404 sí aparecía, pero `handleDelete` relanzaba la búsqueda, el spinner
  desmontaba las alertas (estaban dentro de la rama "no está cargando") y desaparecía al instante.
- **Consulta de eliminados:** las dos búsquedas filtraban siempre `deletedAt IS NULL`. La
  auditoría (`findByIdConAuditoria`) no filtra, así que la "I" funciona para un eliminado.
- **El modal ya tenía** un bloque "Eliminado" en rojo que nunca se veía. Como la baja pisa
  `updatedAt`, el bloque de actualización mostraría la fecha de la baja con el editor anterior.

### Decisión tomada

- **Back:**
  - El adapter recibe el usuario y marca la baja (`remove(producto, usuario)`), igual que envase.
  - `incluirEliminados` (con `@ToBoolean(false)`) en `search-by` y `search-by-rapido`, como último
    parámetro con valor por defecto, para no romper la firma posicional.
  - `eliminado` en cada producto del listado.
- **Front:**
  - Toggle "Mostrar eliminados" junto a filtrados/mostrados, en los dos headers; al cambiarlo se
    relanza la búsqueda activa (rápida o filtrada).
  - Los eliminados se marcan con "Eliminado" en rojo y solo ofrecen "Ver información".
  - Las alertas quedan fuera del spinner, y la confirmación explica que es una baja lógica.
  - En el modal, para un registro eliminado se reemplaza "Actualizado" por "Eliminado por" en rojo.
- **Semántica del toggle:** *incluye* los eliminados junto a los activos, no muestra "solo
  eliminados". Es la misma convención que `incluirEliminados` en los DTOs comunes del back.

### Qué se descartó y por qué

- **Arreglarlo sacando el chequeo del adapter:** se perdía la protección contra dar de baja dos
  veces. Además, el resto de las entidades ya usa el patrón de que el adapter marque la baja.
- **Toggle de "solo eliminados":** duplica la búsqueda y rompe la convención de `incluirEliminados`.
  Se puede agregar después si el equipo lo pide.
- **Permitir editar, ajustar stock o ver el historial de un eliminado:** esos endpoints usan
  `findOne`, que filtra `deletedAt`, y responderían 404. Restaurar un producto queda fuera del
  alcance de PA-055.
- **Evitar que la baja pise `updatedAt`:** requiere una actualización a medida que saltee
  `@UpdateDateColumn`. Se resolvió en la vista, reemplazando el bloque.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- **Back:**
  - `producto.service.ts` (`remove`, `findBy`, `findByRapido`), `producto.persistence-adapters.ts`,
    `producto.repository.ts` y `producto.repository-interface.ts`.
  - `producto.controller.ts`, los dos DTOs de búsqueda, `get-producto.dto.ts` y
    `producto.mapper.ts`.
  - Tests: `producto.service.spec.ts`, `producto.persistence-adapters.spec.ts`,
    `producto.http.spec.ts`, `producto.controller.spec.ts` y `producto.mapper.spec.ts`.
- **Front:**
  - `consultar-producto.tsx`, `header-producto.tsx`, `header-producto-lg.tsx`,
    `producto-action.tsx`, `datos-card.tsx` e `interfaces-producto.tsx`.
  - Nuevos `mostrar-eliminados-toggle.tsx` y `eliminado-badge.tsx`.
  - `informacion-auditoria.tsx` y 4 archivos de test.
- **Contrato:** `incluirEliminados` (opcional, `false` por defecto) en las dos búsquedas, y
  `eliminado` en la respuesta del listado.

### Verificación

- **Back:** 252 tests de producto en verde.
  - Mutación: con las dos líneas viejas del service repuestas, el test de regresión ("delega la
    baja en el repositorio con el usuario, sin marcarla antes") falla.
  - Los specs del adapter verifican que `deletedAt IS NULL` esté o no esté según
    `incluirEliminados`. Antes, quitar esa condición no rompía ningún test.
- **Front:** `vitest run` con 18 archivos y 62 tests en verde. `tsc` sin errores nuevos (125).
- **En vivo:** ver la verificación de la rama de unificación.
- **Sin verificar:** la UI en el navegador.

## [2026-09-24] Seed demo — Catálogo amplio e idempotente para `seed-all`

- **Tarjeta / CR:** ninguna
- **Herramienta:** OpenAI GPT-5.6-Luna vía OpenCode
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt
Síntesis: ampliar el seeder ejecutado por `GET /api/seed-all/execute` para cargar muchos más
datos, cubrir líneas, superlíneas y catálogos relacionados, y garantizar al menos 50 productos.
El equipo pidió poder probarlo antes de cualquier commit.

### Respuesta / propuesta de la IA
Se relevó el seed existente y se encontró que ya cargaba organización, 7 líneas, 3 marcas,
8 envases y solo 7 productos. Se propuso ampliar los catálogos y generar un dataset determinista
de 10 familias de productos con 5 presentaciones cada una.

### Decisión tomada
- Agregar 6 superlíneas, 22 líneas, 10 marcas y un envase adicional (`TABLETA`), conservando
  la superlínea migratoria `Sin clasificar`.
- Generar 50 productos con relaciones a línea, marca, proveedor y envase, presentación válida,
  precio, costo, stock, stock mínimo y código de referencia.
- Usar códigos determinísticos (`ACE-001` a `BOL-005`) como clave de idempotencia: al repetir
  el endpoint no se duplican productos.
- Mantener los seeds existentes de usuarios y organización; el alcance de esta ampliación se
  concentra en catálogo y productos.
- Hacer que un error del seed se propague y no termine en un falso mensaje de éxito.

### Qué se descartó y por qué
- **Insertar datos con SQL o una migración:** el pedido es un seed ejecutable por endpoint y no
  un cambio de esquema.
- **Crear productos sin presentación:** la migración de presentación ya existe y el dataset demo
  debe ejercitar el contrato actual (`envase + dimensión + magnitud`).
- **Usar IDs fijos para las relaciones:** los IDs varían entre bases; se resuelven por
  denominación y código para que el seed sea portable.
- **Recrear o borrar datos existentes:** rompería la idempotencia y podría eliminar datos del
  equipo al probar el endpoint.

### Modificaciones sobre lo generado
Se agregó `TABLETA` como envase porque uno de los productos demo lo necesita. La generación usa
unidades base (`ml`, `g`, `unidades`) para cumplir el `CHECK` de presentación sin depender del
servicio HTTP.

### Impacto
- `seedFamiliaProducto/seed-familia-producto.service.ts`: superlíneas, líneas, marcas y envases.
- `seed-producto/seed-producto.service.ts`: dataset de 50 productos y relaciones.
- `seed-producto/seed-producto.module.ts`: repositorio de envases.
- `seed-all/seed-all.service.ts`: propagación de errores.
- Endpoint: `GET /api/seed-all/execute`.
- Sin migraciones ni cambios de contrato HTTP.

### Verificación
`npm run build` y `git diff --check` pasan. La ejecución real contra MySQL y la comprobación de
conteos mediante el endpoint quedan pendientes para que el equipo la pruebe; no se hizo commit.

## [2026-09-24] Unificación — `unificacion-testing-PA-053-PA-055`, rama única para llevar a `develop`

- **Tarjeta / CR:** PA-053 y PA-055, más lo acumulado en testing (PA-020, arreglo de tests y la integración de PA-029)
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: en las ramas de testing commitear solo lo referido a testing y poner cada funcionalidad
en su PA; crear una rama que unifique todo para después mergearla a `develop`, esperando permiso
del equipo para ese merge.

### Decisión tomada

- La rama `unificacion-testing-PA-053-PA-055` sale de `origin/develop` y mergea, con `--no-ff` y en
  este orden, testing, PA-053 y PA-055.
- Conflictos resueltos:
  - `DECISIONES-IA.md`: quedan las entradas de las dos PA, en orden.
  - En el front, `informacion-auditoria.tsx`: la última modificación se muestra si la hubo
    (PA-053) y si el registro no está eliminado (PA-055).
- **El merge a `develop` queda pendiente de permiso.** En el back, `develop` está protegida y el
  merge tiene que entrar por PR.

### Qué se descartó y por qué

- **Squash de todo en un único commit:** se pierde la trazabilidad por PA que pide la consigna.
- **Mergear las PA directamente a `develop`:** el equipo pidió una rama única y revisar antes.

### Verificación

- Back: `tsc` sin errores; `jest` con 56 suites y 356 tests en verde.
- Front: `vitest run` con 19 archivos y 65 tests en verde; `tsc` con 125 errores, ninguno nuevo.
  Los únicos TS2304 son los 8 viejos registrados en la integración.
- En vivo, back de esta rama levantado en el puerto 3001 contra la base local:
  - historial del producto 1: `usuarioDenominacion` "Jenifer Lopez";
  - `DELETE /producto/7?usuarioId=4`: 200, `deletedAt` cargado y `usuario_deleted_id = 4`;
  - un segundo DELETE: 404;
  - `search-by`: 6 resultados sin `incluirEliminados` y 7 con `incluirEliminados=true`, con
    `MAR-001` marcado `eliminado`. Lo mismo en `search-by-rapido`;
  - `GET /producto/7/audit`: `usuarioDeleted` "Jenifer Lopez".

  Después de la prueba se restauró el producto 7 en la base local.
- **Sin verificar:** la UI en el navegador.

## [2026-09-24] Revisión de deudas técnicas y entorno local sin conexión a la base

- **Tarjeta / CR:** ninguna propia; revisión de deuda técnica
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: revisar si las deudas documentadas siguen activas comprobándolas en el código, no en
este archivo; arreglar el back, que no conectaba a la base; correr los seeds; registrar nuevas
deudas.

### Decisión tomada

- **Causa del `ECONNREFUSED`:** faltaba el `.env`, así que el back usaba `localhost:3306`, mientras
  `docker-compose.yml` publica MySQL en el `3310`. Además, al mover el back a la raíz (`d1a0f5a2`)
  cambió el nombre del proyecto de compose: se crea un volumen nuevo
  (`proyecto1-back-..._mysql_data`) vacío y los datos anteriores quedan en `proyecto_mysql_data`,
  que no se tocó. Los 2 contenedores (`mysql` y `phpmyadmin`) son los esperados.
- Se creó un `.env` local (ignorado por git) con `DB_HOST=localhost`, `DB_PORT=3310`,
  `DB_DATABASE=proyecto`, `JWT_SECRET` y `JWT_EXPIRES_IN`. Sin `JWT_SECRET` el login responde 500
  (`secretOrPrivateKey must have a value`). `.env-temp` no sirve para correr fuera de docker: apunta
  a `mysql:3306` y no trae las variables de JWT.
- Se corrieron las 7 migraciones y `GET /api/seed-all/execute`: 7 usuarios, 50 productos,
  4 proveedores, 22 líneas.

### Estado de las deudas ya registradas (comprobado ejecutando el código)

- **Resuelta:** `search-by-rapido` con `exacto` explícito. En vivo, `exacto=false` devuelve 10
  resultados y `exacto=true` 0, sin 400.
- **Activa pero sin impacto en la UI:** `incluirEliminados` en `PaginationWithDenominacionDto`,
  `DenominacionEmpresaOperadorDto` y `SearchLocalidadDto`. Con `plainToInstance` y
  `enableImplicitConversion`, `"false"` llega como `true`. El front nunca manda `false` (omite el
  parámetro), por eso las pantallas funcionan. Rompe una llamada directa a la API.
- **Activa sin uso:** `codReferenciaExacto` sigue sin llegar a `findBy`, pero ningún front lo envía.
- **Activa:** el seed crea `admin@gmail.com` con `admin`. `LoginDto` exige `@Length(8, 20)` (el
  mensaje dice "entre 6 y 20"), así que esa cuenta nunca puede entrar.
- **Activa:** 40 tests `should be defined`; 34 specs no tienen otro test.
- **Sin verificar:** fechas adelantadas 3 horas (`timezone: '-03:00'` sigue en `app.module.ts`).

### Deuda técnica detectada y no resuelta

- **Testing e2e.** `test/app.e2e-spec.ts` es el placeholder de Nest (`GET /` espera
  `'Hello World!'`) y levanta `AppModule` contra la base real, sin base de test ni seeds. No hay
  ningún flujo cubierto de punta a punta (login, alta y baja de producto, cambio de precio). Del
  lado del front tampoco hay e2e: solo tests unitarios con vitest.
- **Recuperar un producto borrado.** Desde PA-055 la baja es lógica (`deletedAt`,
  `usuario_deleted_id`) y los eliminados se pueden consultar, pero no hay endpoint ni acción en la
  UI para restaurarlos. Hoy solo se recupera editando la base a mano.
