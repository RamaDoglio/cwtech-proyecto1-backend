# Registro de decisiones asistidas por IA

Bitácora de trazabilidad exigida por la consigna (UTN — Ingeniería y Calidad de Software,
Proyecto 1). Se registra **una entrada por decisión significativa**, con los mismos criterios
que el `CLAUDE.md` del frontend (cambios de dominio, esquema, contrato, reglas de negocio,
tarjetas y CR, decisiones de diseño, deuda técnica, convenciones y estrategia de testing).

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
