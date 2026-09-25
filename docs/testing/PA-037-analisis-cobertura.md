# PA-037 — Análisis de los tests automáticos y de la cobertura

> Informe compartido entre los dos repositorios. Hay una copia idéntica en
> `Proyecto1-Back-…/docs/testing/` y otra en `cwtech-proyecto1-frontend/docs/testing/`.
>
> - **Fecha:** 2026-09-24
> - **Base medida:** back `testing` @ `ad021035`, front `Pa-020-Testing` @ `26124b1`
> - **Objetivo de cobertura:** 70 %

## 1. Resumen

| | Back (NestJS + Jest) | Front (React + Vitest) |
|---|---|---|
| Suites / archivos de test | 55 | 15 |
| Casos | 336, todos en verde | 54, todos en verde |
| Tipo de test | Solo unitarios (el único e2e no corre) | Solo unitarios de componentes y utilidades |
| Statements, medición bruta | **22,7 %** (1425/6287) | **10,0 %** (2522/25324) |
| Statements, ajustada ¹ | **27,6 %** (1425/5159) | **10,9 %** (2373/21719) |
| Módulo de productos, ajustada ¹ | **43,2 %** (709/1643) | **19,7 %** (1402/7132) |
| ¿Cumple el 70 %? | No | No |

¹ **Ajustada.** En el back se excluyen seeders, migraciones y los `*.module.ts`. En el front se
excluyen los componentes shadcn/ui generados y el código muerto de `gestion-producto` (ver §5.3).
El número bruto es el que da la herramienta. El ajustado es el que conviene usar para medir el
objetivo, una vez que el equipo acepte esas exclusiones.

**Cobertura combinada de la aplicación:** unos **14 %** de statements ajustados, 3798 de 26878.
**Producto (back + front):** unos **24 %**, 2111 de 8775.

**Conclusión.** El objetivo del 70 % está lejos en los dos repositorios. La lógica de dominio de
producto está bien testeada: precio, stock, historial de precios, presentación y denominación
automática. Lo que hunde el número es:

- **Back:** las capas de repositorio en 0 %, Marca sin tests de reglas y 32 specs que solo
  verifican `should be defined`.
- **Front:** las pantallas de consulta, el cambio masivo de precios y los módulos de organización
  y herramientas, todos sin tests.

## 2. Cómo se midió

- **Back.** Se ejecutó `jest --coverage` con la configuración del repo (`jest.config.js`). Esa
  configuración ya excluye `*.entity.ts`, `*.dto.ts`, `*.enum.ts`, `*.interface.ts`, `index.ts`
  y `main.ts`.
- **Front.** Se agregó `@vitest/coverage-v8` (v3.2.7, alineado con vitest 3.2.7), la sección
  `coverage` en `vitest.config.ts` y el script `yarn test:cov`. Se mide todo `src/**/*.{ts,tsx}`
  salvo tests, `src/test`, `src/interfaces`, `*.d.ts` y `main.tsx`.
- **Análisis cualitativo.** Se leyeron todos los specs y el código de producción de cada módulo
  para identificar qué casos de uso y qué reglas de negocio verifica cada test.
- **Advertencia sobre ramas en el front.** El porcentaje de ramas (≈55 %) **no es
  representativo**. El proveedor v8 cuenta una sola rama por cada archivo que ningún test carga,
  así que el denominador queda muy chico. Para el front conviene mirar statements y líneas.

## 3. Back — qué alcanzan los tests

### 3.1 Cobertura por módulo (statements, sin seeders ni migraciones)

| Módulo | Cobertura | Observación |
|---|---:|---|
| `gestion-productos/producto` | 58,7 % | Aplicación 79,5 %, dominio 58 %, infraestructura 22 % |
| `gestion-productos/superlinea` | 39,4 % | Servicio 87 %, repositorio 0 % |
| `gestion-productos/linea` | 30,2 % | Servicio 66 %, repositorio 0 % |
| `gestion-productos/envase-presentacion` | 26,2 % | Servicio 83 %, controller y repositorio 0 % |
| `gestion-productos/marca` | 21,7 % | Servicio 20 %, solo tiene un smoke test |
| `common` (filtros, pipes, excepciones) | 18–88 % | El filtro global de excepciones está bien cubierto |
| `gestion-usuario` (auth, rol, usuario) | 15–23 % | Solo smoke tests |
| `organizacion` (cliente, proveedor, personal, empresa) | 5–15 % | Solo smoke tests. Proveedor y ClienteService no tienen spec |
| `gutil` (IVA, provincia, localidad, domicilio) | 16–30 % | Solo smoke tests |
| `gestion-sistema` (auditoría, configuración) | 10–23 % | Solo smoke tests |

Los porcentajes de los módulos sin tests reales no son 0 % porque importar un archivo ya ejecuta
sus decoradores y declaraciones. Ese número **no significa** que haya lógica probada.

### 3.2 Casos de uso y reglas de negocio verificados

**Producto: 12 specs, 156 `it` (unas 230 ejecuciones con `it.each`). Es el único módulo con tests de comportamiento reales.**

| Caso de uso | Reglas que verifican los tests |
|---|---|
| Registrar producto | El precio se deriva de costo × (1 + margen). El margen general es 15 %. Se rechaza un `precio` manual (400). El costo es obligatorio y el margen ≥ 0. Redondeo a 5 decimales |
| Modificar producto | Recalcula el precio y registra el historial en una sola transacción. No registra historial si el precio no cambia. Rechaza un precio que quede en 0 |
| Ajustar stock (ingreso, egreso, manual) | El stock nunca queda negativo (`StockNegativoException` → 409). El ajuste manual exige motivo. La cantidad debe ser ≠ 0. Movimiento y stock se guardan en la misma transacción, con bloqueo `pessimistic_write` |
| Alerta de stock bajo | `stock <= stockMinimo` solo cuando la regla está habilitada |
| Cambio de precio individual | El precio nuevo debe ser > 0 y el motivo es obligatorio. Se registra el historial con el precio anterior y el nuevo |
| Cambio masivo de precios (CR-006) | Porcentaje o monto fijo, global o por línea. Todo o nada: si un precio queda ≤ 0 se revierte la operación completa. Se registra el historial por producto y el historial masivo. Porcentaje ≤ −100 % → inválido |
| Consultar historial de precios | Paginado, ordenado por fecha descendente. Producto inexistente → 404 |
| Presentación (CR-002) | Es obligatoria en el alta y no se puede quitar después. R1–R4 de medida: unidades válidas, cantidad > 0, decimales por unidad y máximos. Normalización a unidad base. El envase debe existir |
| Denominación automática (CR-005) | Se arma como "MARCA LÍNEA PRESENTACIÓN", se valida su unicidad y el PUT no la regenera |
| Búsqueda | Filtros LIKE sin distinguir mayúsculas sobre denominación, línea y superlínea. Booleanos de query `exacto`, `conStock` y `codProveedorExacto` |

**SuperLínea** (22 casos): denominación única. Una superlínea de sistema no se modifica ni se
elimina. La baja reasigna sus líneas a "Sin clasificar", que no se puede eliminar.

**Línea** (15 casos): la SuperLínea es obligatoria (≥ 1) y tiene que existir. El listado se
agrupa por SuperLínea.

**Envase** (9 casos): denominación única, incluidos los envases eliminados. Un envase de sistema
no se modifica. No se puede dar de baja un envase que usan productos activos.

**Marca** (10 casos): solo delegación del controller. **No verifica ninguna regla.**

**Transversal:**

- Filtro global de excepciones: códigos `STOCK_NEGATIVO`, `MOTIVO_REQUERIDO`,
  `CANTIDAD_INVALIDA`, `NO_ENCONTRADO` y `VALIDACION_DTO`, con el formato de body estándar.
- Pipe de normalización de denominación: mayúsculas y trim.

**Resto de los módulos** (usuario, auth, rol, organización, gutil, sistema, documentos): 32 specs
con un único `it('should be defined')`. **No ejercitan ningún caso de uso.**

**e2e:** `test/app.e2e-spec.ts` solo prueba `GET /` → "Hello World!". Además, casi seguro que no
corre: a `jest-e2e.json` le falta el `moduleNameMapper` de `src/` y el test necesita MySQL real.

## 4. Front — qué alcanzan los tests

### 4.1 Cobertura por área (statements)

| Área | Cobertura | Observación |
|---|---:|---|
| `gestion-producto/producto` | 44,2 % ² | El formulario de alta y modificación está bien cubierto. La consulta está en 0 % |
| `gestion-producto/superlinea` | 27,0 % | Formulario y tarjeta testeados |
| `gestion-producto/envase-presentacion` | 21,7 % | Solo el formulario |
| `gestion-producto/marca` | 5,1 % | Sin tests |
| `gestion-producto/linea` | 2,2 % | Sin tests |
| `gestion-producto/precios` | 0 % ² | Cambio masivo de precios (CR-006) y lista de precios sin tests |
| `gestion-organizacion` | 0 % | 73 archivos, 4737 statements |
| `herramientas` | 9,0 % | Componentes compartidos |
| `utils` (auth, errores, PrivateRoute) | 60–95 % | Bien cubierto |
| Páginas, contextos, hooks, navbar, sidebar | 0 % | |

² Sin el código muerto (§5.3).

### 4.2 Casos de uso y reglas verificados

| Caso de uso | Reglas que verifican los tests |
|---|---|
| Alta y modificación de producto | Se envían costo y margen, nunca `precio` ni `stock`. Vista previa del precio. Denominación en minúsculas. Los `details` de un 400 se asignan al campo. Presentación obligatoria en el alta, valor con ≤ 2 decimales, no se puede vaciar en la edición. Un producto viejo sin presentación la tiene opcional, pero si se completa un campo se exigen los tres |
| Precio estimado | Margen general 15 %, redondeo a 5 decimales (`politica-precio.ts`) |
| Ajuste manual de stock | Payload `{cantidad, motivo, usuarioId}`. Un 409 `STOCK_NEGATIVO` muestra un mensaje claro |
| Historial de precios | Columnas, formato `$ 1.200,00`, estados de carga, vacío y 404, paginación |
| Alta y modificación de superlínea y envase | Denominación obligatoria y en minúsculas. Un 409 muestra "denominación en uso" o "modificado por otra operación". Las de sistema quedan de solo lectura |
| Tarjeta de superlínea | Sistema → Editar y Eliminar deshabilitados. Eliminada → sin acciones |
| Login | Formato de correo inválido: no llama al backend |
| Sesión y rutas privadas | Sin token → `/login`. Token corrupto → `/login`. Rol sin permiso → mensaje de acceso denegado |
| Errores HTTP | Clasificación 400/404/409/red y mapeo de `details` a campos del formulario |

## 5. Puntos clave a mejorar (priorizados, con foco en producto)

### 5.1 Back — producto

La meta es llevar `gestion-productos` del 43 % a más del 70 %. Faltan unos 440 statements.

1. **Repositorios de gestion-productos (0 %, unos 600 statements sin cubrir). Es el salto más
   grande.** Hoy el único spec de adapter usa un QueryBuilder mock con `toHaveBeenCalledWith`,
   que no detecta si se agrega o se quita una condición. Hay dos caminos:
   - **(a)** Tests de integración contra SQLite en memoria. `test/jest-setup.ts` ya define las
     variables, pero ningún test crea un `DataSource`. Sería el primer nivel de integración.
   - **(b)** Seguir con mocks, afirmando la lista completa de condiciones.

   Lo que cubren:
   - Filtros de `findBy` y `findByRapido` (código exacto o LIKE, marca, línea, proveedor,
     `conStock`, excluir eliminados).
   - `existsByDenominacion` y `existsByCodigoProveedor`.
   - `existsProductosActivosBy*`, que son la base de las bajas en cascada.
   - `removeAndReassign` de SuperLínea.
   - `remove` → "Entidad ya eliminada".
2. **Bajas sin ningún test:**
   - Producto: `producto.service.ts:144`, soft delete y protección de entidades de sistema.
   - Línea: `linea.service.ts:188`, que no se puede dar de baja con productos activos.
   - Marca: `marca.service.ts:136`.
3. **Marca:** el servicio no tiene tests de reglas. Faltan unicidad de denominación, entidad de
   sistema → 403 y baja con productos activos → 409.
4. **Vista previa del cambio masivo** (`producto.service.ts:352-400`): 0 tests. Marca
   `valido:false` por producto y cuenta `cantidadInvalidos`.
5. **Unicidad del producto:** `ProductoUniquenessValidator` (denominación y código de proveedor)
   y `ProductoRelatedEntitiesValidator` (marca, línea y envase activo) están siempre mockeados.
6. **Precio con IVA** (`producto.mapper.ts:113`): la regla de IVA que se muestra al usuario no
   tiene test.
7. **Controller de envase** (0 %) y endpoints de producto sin test HTTP: `DELETE :id`,
   `GET :id/audit`, preview y ajuste masivo.

### 5.2 Front — producto

La meta es llevar `gestion-producto` del 20 % a más del 70 %. Faltan unos 3600 statements. Es
alcanzable con tests de componentes (Testing Library, mockeando los `*-service`) sobre estos
puntos:

1. **Cambio masivo de precios (CR-006), unos 1000 statements.** Incluye `cambio-precios-masivo.tsx`,
   `filtros-cambio-precios.tsx`, `useCambioPrecios.ts` (normalización pura de la vista previa) y
   el modal de edición manual. La sección 4 de `TESTING_CHECKLIST.md` se puede automatizar casi
   entera:
   - Alcance obligatorio.
   - Línea obligatoria si el alcance es LINEA.
   - |porcentaje| ≤ 100.
   - Valor ≠ 0.
   - No se puede guardar sin una vista previa válida.
   - "N de M productos quedarían con precio inválido".
   - Refresco de la tabla después de guardar.
2. **`consultar-producto.tsx`, unos 630 statements.** Alerta de stock crítico (una sola vez por
   producto), búsqueda con mínimo de caracteres, borrado lógico con confirmación y reintento ante
   404, y acciones condicionadas por permisos.
3. **`domain/permisos-producto.ts`:** funciones puras de permisos por rol. Son el test más
   barato, y hoy nada garantiza quién puede agregar, editar o ver precios.
4. **Línea y marca (2 % y 5 %):**
   - Esquemas yup: `stockMinimo` obligatorio si `utilizaStockMinimo`; SuperLínea obligatoria.
   - `normalizeDenominacion` y `existeSublinea`, funciones puras.
   - Formularios y consultas.
5. **Reglas de esquema de producto sin test directo:** `stockMinimo` y `cantidadPorPack`
   condicionales, alícuota dentro del enum, validaciones del cliente en el ajuste de stock
   (entero ≠ 0, motivo obligatorio) y los mappers `transformData`.

### 5.3 Decisión pendiente: qué entra en el denominador del front

Hay unos **2300 statements de código muerto** en `gestion-producto` que ningún archivo importa:

- En `precios/`: `iveco/`, `nex-pro/`, `importaciones/`, `comparacion-importaciones/`,
  `productos-importacion/` y `carga-archivo.tsx`.
- En `producto/`: `calculo-precio-productos.tsx`, `registrar-item-proveedor.tsx`,
  `registrar-item-prod-alternativo.tsx`, `use-producto-modales.ts` y `use-consultar-productos.ts`.

A eso se suman unos **1300 statements de componentes shadcn/ui generados**.

**Recomendación:** borrar el código muerto (preferible) o excluirlo en `coverage.exclude`, y
excluir los componentes shadcn. En esta rama se dejaron **sin excluir** para no esconder nada
hasta que el equipo decida.

### 5.4 Transversal (fuera de producto, pero con riesgo alto)

1. **Seguridad: `PATCH /auth/cambiar-contrasena` es público y no verifica el código de
   recuperación** (`auth.service.ts:237-255`). Con solo conocer el mail se puede cambiar la
   contraseña de cualquier usuario. Hace falta un arreglo, en una tarjeta propia, y su test.
2. **`AuthGuard`** (`auth.guard.ts:35`): si el endpoint no tiene `@Roles`, deja pasar sin token.
   Faltan tests que fijen ese comportamiento: 401 sin token, 403 por rol, token inválido.
3. **Validación de CUIT** (`condicion-iva-validation-helper.ts:58-71`) y la regla
   `requiereCuit`/`requiereDocumento`. Es una función pura que usan cliente y proveedor.
4. **Unicidad de CUIT, DNI y denominación** en cliente y proveedor, y la protección de entidades
   de sistema (`ensureNotSistemaEntity`).
5. **Los 32 smoke specs** (`should be defined`) inflan el conteo de tests sin probar nada.
   Conviene reemplazarlos por tests de reglas a medida que se toque cada módulo.
6. **e2e:** arreglarlo (agregar `moduleNameMapper` y una base de prueba) o eliminarlo, así no
   figura como test existente.
7. **Umbrales:** una vez alcanzado un nivel, fijar `coverageThreshold` en Jest y
   `coverage.thresholds` en Vitest por carpeta (empezando por `gestion-productos`), para que la
   cobertura no retroceda.

### 5.5 Qué hace falta para el 70 %

- **Back, 70 % ajustado global:** faltan unos 2200 statements. Con §5.1 completo, productos
  llega a unos 75–80 % y el global a unos 38 %. El resto depende de testear usuario, auth y
  organización (§5.4).
- **Front, 70 % global:** faltan unos 12800 statements, aun con las exclusiones. No es realista
  solo con tests unitarios en el corto plazo, porque `gestion-organizacion` y `herramientas`
  suman 10000 statements. **Propuesta:** fijar el 70 % primero sobre el alcance de producto
  (`gestion-producto` + `utils`) y extenderlo por módulo.

## 6. Defectos encontrados durante el análisis (sin test que los detecte)

Verificados leyendo el código:

| # | Repo | Ubicación | Defecto |
|---|---|---|---|
| 1 | back | `auth.service.ts:237` | Cambio de contraseña sin verificar el código, en un endpoint público (§5.4) |
| 2 | back | `auth.guard.ts:35` | Un endpoint con guard pero sin `@Roles` queda accesible sin token |
| 3 | back | `producto.service.ts:458,464` | `cantidadProductosAfectados` cuenta también los productos cuyo precio no cambió |
| 4 | back | `producto.persistence-adapters.ts:295` | `findByDenominacionCodigoProveedorFiltered` ignora el parámetro `denominacion` |
| 5 | back | `linea.persistence-adapter.ts:72-74` | `update` pisa `usuarioCreatedId`, no asigna `usuarioUpdatedId` y resetea `stockMinimo` a 0 si no viene |
| 6 | back | `search-producto-pagination-with.dto.ts:42` | `codReferenciaExacto` existe en el DTO, pero el controller no lo usa |
| 7 | front | `interfaces-validaciones-producto.tsx:129,135` | Los mensajes de `typeError` de marca y línea están cruzados |
| 8 | front | `interfaces-validaciones-producto.tsx:115` | En la regex, `%-_` es un rango: deja pasar `( ) * + < = > @ [` pese al mensaje "solo letras, números y espacios" |

Reportados en el análisis y **no verificados** por separado:

- Stock entero (PA-011) contra `AjustarStockManualDto.cantidad` con `@IsNumber`, que acepta
  decimales.
- `localidad.service.ts:51` lanza un `Error` genérico, lo que da un 500.
- El mensaje de `alicuota-iva.service` dice "Marca".
- La ruta `cambio-precios-masivo` del front no restringe por rol (el checklist pide Root/Admin).
