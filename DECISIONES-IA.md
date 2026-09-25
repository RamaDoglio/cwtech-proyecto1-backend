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

## [2026-09-24] PA-037 — Análisis de los tests automáticos y de la cobertura (back + front)

- **Tarjeta / CR:** PA-037
- **Herramienta:** Claude Opus 5.5 vía Claude Code (extensión de VS Code)
- **Autor/a que condujo la sesión:** Lisandro
- **Link a la conversación:** no disponible (CLI)

> Decisión compartida entre los dos repos. Hay una entrada equivalente en el `DECISIONES-IA.md`
> del otro repositorio. El informe completo está en `docs/testing/PA-037-analisis-cobertura.md`,
> idéntico en ambos.

### Prompt
(Resumido.) Analizar los tests actuales de la aplicación: qué módulos alcanzan, qué casos de uso
siguen y qué reglas de negocio verifican. Estimar el porcentaje de cobertura frente al objetivo
del 70 % y, si no se cumple, identificar los puntos clave a mejorar, con atención especial a
producto. Trabajar en una rama que sale de testing, como parte de PA-037. Los tests automáticos
existentes son solo unitarios.

Aclaraciones del usuario:

- Alcance: back y front.
- Medir de verdad y además analizar.
- "Producto" es el módulo `gestion-productos` completo.
- Entregable: un informe `.md` en el repo más esta entrada, sin escribir tests nuevos todavía.

### Respuesta / propuesta de la IA
- Se midió la cobertura real:
  - Back: `jest --coverage` con la configuración existente.
  - Front: se agregó `@vitest/coverage-v8` y la sección `coverage` de `vitest.config.ts`.
- Se calculó una cobertura "ajustada":
  - Back: sin seeders, migraciones ni `*.module.ts`.
  - Front: sin shadcn/ui ni código muerto.
- Se analizó cada spec para mapear casos de uso y reglas.

Resultados, en statements:

| | Bruta | Ajustada | Productos (ajustada) |
|---|---:|---:|---:|
| Back | 22,7 % | 27,6 % | 43,2 % |
| Front | 10,0 % | 10,9 % | 19,7 % |

Ninguno alcanza el 70 %. Las brechas priorizadas y 8 defectos verificados están en el informe.

### Decisión tomada
- Rama `PA-037-analisis-cobertura` en los dos repos. En el back sale de `testing`; en el front,
  de `Pa-020-Testing`.
- Front:
  - Se agrega `@vitest/coverage-v8` 3.2.7 como devDependency.
  - Se configura `coverage` en `vitest.config.ts` (reporters text, json-summary, html y lcov).
  - Se agrega el script `yarn test:cov`.
  - Se agrega `/coverage` a `.gitignore`.
- Se agrega el informe `docs/testing/PA-037-analisis-cobertura.md` en ambos repos.

### Qué se descartó y por qué
- **Estimar la cobertura solo leyendo el código:** era menos confiable y el costo de medir era
  bajo.
- **Excluir ya el código muerto y shadcn/ui en `vitest.config.ts`:** es una decisión del equipo.
  Excluir sin avisar mejora el número escondiendo código. El informe muestra las dos cifras y
  recomienda borrar el código muerto.
- **Fijar ahora `coverageThreshold` / `thresholds`:** con 10–28 % haría fallar la suite sin
  aportar nada. Queda recomendado para después de cerrar las brechas de producto.
- **Arreglar en esta rama los defectos encontrados** (entre ellos el cambio de contraseña sin
  verificación del código): la rama de testing solo recibe cambios de testing y el entregable
  pedido era el análisis. Van a tarjetas propias.
- **Instalar con npm:** el front usa yarn (README y `node_modules/.yarn-integrity`).

### Modificaciones sobre lo generado
- El conteo de casos de producto se corrigió a mano contra el número real de `it`.
- Los hallazgos más graves de los agentes de lectura se verificaron uno por uno en el código. Los
  que no se verificaron quedan marcados así en el informe.

### Impacto
- **Front:** `package.json`, `yarn.lock`, `vitest.config.ts`, `.gitignore` y
  `docs/testing/PA-037-analisis-cobertura.md`.
- **Back:** `docs/testing/PA-037-analisis-cobertura.md`.
- Sin cambios en código de producción ni en tests.

### Verificación
- Back: 55 suites y 336 tests en verde con coverage.
- Front: 15 archivos y 54 tests en verde con `vitest run --coverage`.
- **Sin verificar:**
  - La instalación se hizo con `--ignore-engines`: `jsdom@30` pide Node ≥ 22.22 y el entorno
  local tiene 22.14. Es una incompatibilidad que ya existía y que no introduce este cambio.
  - Que `test:cov` funcione en CI (no hay CI configurado para el front).
  - Los defectos listados como "no verificados" en §6 del informe.

---

## [2026-09-25] PA-037 — Ampliación de cobertura de comportamiento en gestion-productos

- **Tarjeta / CR:** PA-037
- **Herramienta:** OpenAI GPT-5.6 vía OpenCode
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt
Síntesis: continuar el trabajo de testing exigido por `docs/testing/PA-037-analisis-cobertura.md`,
mejorando el backend, haciendo commits cada pocos casos y actualizando al final el informe.

### Respuesta / propuesta de la IA
Se priorizaron las brechas de `gestion-productos` indicadas por el informe: reglas de Marca y Línea,
adapter de persistencia de Producto y vista previa del cambio masivo de precios. Se propusieron tests
unitarios de comportamiento con repositorios y QueryBuilder simulados, manteniendo el alcance de la
rama de testing.

### Decisión tomada
Se agregaron 23 casos reales en tres commits: bajas y unicidad de Marca/Línea; consultas, existencias,
paginación y errores del adapter de Producto; y la vista previa de cambio masivo, incluyendo precios
inválidos y alcance por Línea. Se actualizó el informe con la medición completa de 357 tests y 24,1 %
de statements brutos.

### Qué se descartó y por qué
- **SQLite en memoria:** no se agregó en esta tanda porque habría cambiado la estrategia de testing y
  requerido configurar entidades, DataSource y transacciones; primero se amplió la cobertura unitaria
  priorizada por la tarjeta.
- **Reemplazar los smoke tests restantes:** se dejó para futuras tandas para no mezclar una limpieza
  amplia con casos de negocio nuevos.
- **Arreglar el error de `@nestjs/swagger`/`PartialType`:** es un problema preexistente de carga de
  la suite de controller, fuera del alcance de agregar tests; las suites modificadas sí se verificaron.
- **Fijar un umbral de cobertura:** 24,1 % todavía no representa un umbral útil y haría fallar la
  ejecución global antes de cerrar las brechas pendientes.

### Modificaciones sobre lo generado
Se ajustaron los mocks del QueryBuilder para soportar las operaciones realmente ejercitadas y se
conservaron las aserciones sobre la lista completa de condiciones. No se modificó código de producción.

### Impacto
- `marca.service.spec.ts`: reglas de unicidad, sistema y baja.
- `linea.service.spec.ts`: reglas de baja.
- `producto.persistence-adapters.spec.ts`: consultas, existencias, persistencia y errores.
- `producto.service.spec.ts`: preview de cambio masivo.
- `docs/testing/PA-037-analisis-cobertura.md`: resultados y pendientes actualizados.

### Verificación
- Tandas aisladas: 26, 13 y 37 tests verdes, respectivamente.
- Suite completa con coverage: 54 suites pasaron y 357 tests ejecutados; `producto.controller.spec.ts`
  no inicia por `inheritValidationMetadata is not a function`, error preexistente documentado en el
  informe. `git diff --check` sin errores.
- Sin verificar: integración contra una base real/SQLite y la corrección de la incompatibilidad de
  Swagger.

## [2026-09-25] PA-037 — Alcance de 70 % para gestion-productos

- **Tarjeta / CR:** PA-037
- **Herramienta:** OpenAI GPT-5.6 vía OpenCode
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt
Síntesis: continuar la ampliación de tests del backend, medir nuevamente `gestion-productos` y
seguir trabajando si todavía no supera el 70 %.

### Respuesta / propuesta de la IA
Se midió el módulo de forma aislada con Jest y se priorizaron las brechas con mejor relación entre
casos de comportamiento y statements cubribles: controller de Producto y adapters de Línea y Marca.
Se mantuvo el enfoque unitario con QueryBuilders, repositorios y transacciones simulados.

### Decisión tomada
Se agregaron tests para delegación HTTP del controller, creación, actualización, búsquedas, bajas,
auditoría, stock, precios e historial, además de consultas, paginación, auditoría, baja lógica y
errores de los adapters de Línea y Marca. La medición aislada final de `gestion-productos` es
**70,02 % de statements (1698/2425)**, con 27 suites y 358 tests verdes.

### Qué se descartó y por qué
- **SQLite o integración contra una base real:** no era necesario para cruzar el umbral y habría
  cambiado la estrategia, incorporando configuración de entidades, DataSource y transacciones.
- **Tests de todos los repositorios restantes:** se priorizó alcanzar el objetivo con comportamiento
  relevante; quedan pendientes adapters de Producto, SuperLínea y Envase en la medición de cobertura
  del código que aún no ejecutan los specs.
- **Fijar un `coverageThreshold` global:** el backend completo sigue por debajo del 70 % y el umbral
  haría fallar la suite global antes de cerrar la deuda de los demás módulos.

### Modificaciones sobre lo generado
El spec del controller necesitó un mock de `PartialType` de `@nestjs/swagger` para evitar la
incompatibilidad de versiones existente al cargar la suite. Los adapters requirieron mocks de
QueryBuilder y QueryRunner para probar sus caminos sin conectar una base real.

### Impacto
- `src/modules/gestion-productos/producto/application/controllers/producto.controller.spec.ts`
- `src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.spec.ts`
- `src/modules/gestion-productos/marca/infraestructure/repositories/marca.persistence-adapters.spec.ts`
- `docs/testing/PA-037-analisis-cobertura.md`
- No se modificó código de producción ni contratos HTTP.

### Verificación
- Suite aislada: 27 suites y 358 tests en verde.
- Cobertura aislada: 70,02 % statements, 66,66 % branches, 46,39 % functions y 70,52 % lines.
- Sin verificar: nueva ejecución de la suite completa global después de esta tanda y cobertura global
  recalculada; la incompatibilidad de Swagger permanece documentada.
