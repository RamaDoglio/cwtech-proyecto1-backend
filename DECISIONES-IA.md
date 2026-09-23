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
