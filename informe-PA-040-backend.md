# PA-040 — Verificar historial Git y trazabilidad de PRs (Backend)

## 1. Metadatos

| Campo | Valor |
|---|---|
| Repositorio | `git@github.com:RamaDoglio/cwtech-proyecto1-backend.git` |
| Owner | `RamaDoglio` |
| Rama principal | `main` — HEAD `570974a` (*Release 22/09/2026*) |
| Rama de integración | `develop` — HEAD `6013725` (*Unificacion testing pa 053 pa 055*) |
| Rama de testing | `testing` — HEAD `ad02103` |
| Responsable | _`Ramiro Doglio`_ |
| Fecha de recolección | 2026-09-24 |
| Última sincronización | `git fetch --all --prune` |
| Estado PA-040 | **Cumple con excepciones** |

## 2. Evidencia recolectada

Archivos en `evidencias/PA-040/backend/`:

| Archivo | Comando origen |
|---|---|
| `git-log-graph.txt` | `git log --graph --oneline --decorate --all` |
| `git-log-plano.txt` | `git log --pretty=format:'%h \| %ad \| %an \| %s' --date=short --all` |
| `git-merges.txt` | `git log --merges --oneline --decorate --all` |
| `git-commits-pa.txt` | `git log --all --grep='PA-' --oneline` |
| `git-commits-cr.txt` | `git log --all --grep='CR-' --oneline` |
| `git-refactors.txt` | `git log --all --grep='refactor' -i` |
| `git-breaking.txt` | `git log --all --pretty=format:'%h %s' \| grep -E '!:'` |
| `git-branches.txt` | `git branch -a` |
| `git-ramas-no-mergeadas-main.txt` | `git branch -a --no-merged origin/main` |
| `prs-desde-git.txt` | `git log --all --merges ... \| grep -Eo 'Merge pull request #...'` |

## 3. Commits descriptivos y comprensibles

### 3.1 Convención observada

Formato **Conventional Commits** en buena parte de los commits recientes:

```text
feat(producto): implementar MovimientoStock y ajuste de stock con trazabilidad
fix(producto-operacion)!: retirar endpoints scaffold sin autenticación
test(controllers): corregir tests ignorados y eliminar exclusiones temporales
docs(producto): explicitar que stock es siempre entero (PA-011)
refactor(producto): muevo el cálculo de precio al servicio
fix(validaciones): acotar CUIT de Cliente/Proveedor a 11 caracteres
fix(validaciones): obligatoriedad condicional de stockMinimo/cantidadPorPack
fix(validaciones): agregar rango 0-999 a porcentaje de Producto
fix(validaciones): agregar minimo y regla precio>=costo en Producto
fix(validaciones): exigir al menos un tipo de proveedor en el backend
fix(validaciones): validar domicilio anidado en Cliente/Proveedor
feat(superlinea): implementar SuperLínea y relación obligatoria con Línea
feat(seed): agrego seed de productos de ejemplo
fix(seed): asigno superlínea por defecto en el seed de líneas
fix(producto): corrijo el soft delete de productos
feat(producto): expongo el responsable en el historial de precios
docs(ia): registro la decisión de PA-053
test(producto): cubro el soft delete y la búsqueda con eliminados
hotfix(producto): elimino doble importación DataSource
```

---

### 3.2 Commits que NO siguen la convención

| Commit | Mensaje | Problema |
|---|---|---|
| `e2b0130` | `incial` | Typo, sin tipo, sin scope |
| `d9851a2` | `Fix: El error es claro: mysql2 v3 no acepta ssl: true (booleano). Aiven exige SSL` | Mensaje narrativo, no describe el cambio, sin scope |
| `cb59265` | `PA-011 — Definir matriz común de validaciones` | Sin tipo conventional |
| `97d81dc` | `PA-003: Adaptar frontend a la política de precio` | Sin tipo |
| `18ccf22` | `PA-002: Alinear API de Producto con política de precio` | Sin tipo |
| `a56d0af` | `PA-001: Definir y encapsular política de precio` | Sin tipo |
| `5d0b0df`, `845bc90` | `chore: ignoro mis carpetas de opencode` | Duplicado idéntico |
| `a64269a` | `fix(gitIgnore)` | Scope mal formado (camelCase en scope) |
| `66f7ee9` | `Release: actualizar main desde develop (12/09/2026)` | Sin tipo conventional |
| `d1a0f5a` | `chore: muevo backend a la raíz` | OK conventional, sin scope, alto impacto |
| `9428d1f` | `chore: elimino node_modules del repositorio` | OK conventional, sin scope |
| `fb0eb63` | `fix: run DB migrations on container start` | Sin scope, en inglés |
| `243df9d` | `docs: agrego URLs de producción al README` | OK conventional, sin scope |
| `6013725` | `Unificacion testing pa 053 pa 055` | Sin tipo, sin scope, sin tilde |
| `3b31d83` | `Merge pull request #31 from RamaDoglio/PA-029-—-Implementar-búsqueda-por-Denominación/Línea/SuperLínea-` | Rama con em-dash y slashes |
| `d93c4ff` | `PA-020 — Corregir filtro exacto de productos` | Sin tipo conventional |
| `ce2aa10` | `PA-029 — Implementar búsqueda por Denominación/Línea/SuperLínea en backend (CR-004)` | Sin tipo (pero incluye CR) |
| `303dfe8` | `test/ajuste de precio` | Usa `/` en vez de `:` |
| `2ffe47d` | `PA- 016 implementar actualizacion masiva de precios back` | Sin tipo, espacio tras `PA-`, typo |
| `6538073` | `PA-16: Implementar actualizacion masiva de precios` | Sin tipo, PA-16 vs PA-016 |
| `678d833` | `feat:PA-016-Actualización masiva de precios` | Falta espacio tras `feat:` |
| `e0e172f` | `PA-018: Implementar cambio de precio con trazabilidad e historial` | Sin tipo |
| `16e082f` | `cambios en la tabla` | Sin tipo, vago |
| `bce9653` | `Hotfix: registrar historial de precios en la edición directa y ajuste masivo.` | `Hotfix` no es conventional, con mayúscula y punto final |
| `3c224f0` | `PA-006 — Exponer endpoint de ajuste de stock` | Sin tipo |
| `684c44a` | `feat: Presentacion VO y envase como catalogo` | Sin scope |
| `570974a`, `57d611a`, `3df76ab` | `Release <fecha>` | Sin tipo conventional |
| `b1502ec`, `473156b` | `test/ajuste de precio - ...` | Usa `/` en vez de `:` |
| `31b151a` | `hotfix(producto): elimino doble importación DataSource` | `hotfix` no es tipo conventional estándar |
| `4c508f4` | `feat/PA-051-implementacion-bajoMinimo` | Usa `/` en vez de `:` |
| `d5f1451` | `Resolver conflictos con develop` | Sin tipo, sin scope |
| `b6d2b85`, `9a69eba`, `01948a6`, `90ae5d1`, `0ca0f24`, `3b31d83` | `Merge pull request ...` | Normal en merges |

**Conclusión:** conviven tres estilos: (1) Conventional Commits correcto (`feat(superlinea): ...`), (2) prefijo `PA-XXX:` sin tipo, y (3) mensajes sin convención (`incial`, `cambios en la tabla`). Los commits de validaciones y de stock son el mejor ejemplo a seguir. Los commits fundacionales y de release siguen sin convención.

## 4. Trazabilidad PR ↔ tarjeta PA-XXX / CR

### 4.1 PRs con tarjeta y merge commit explícito (trazabilidad fuerte)

| PR | Rama | Tarjeta | CR | Commit merge | Fecha | Estado |
|---|---|---|---|---|---|---|
| #7 | `bugfix/PA-046-Arreglo-Test-Ignorados` | PA-046 | — | `af2c65b` | 2026-09-14 | Mergeado |
| #8 | `pa-015-filtro-proveedor` | PA-015 | — | `8db9326` | 2026-09-13 | Mergeado |
| #10 | `PA-022-revisar-y-retirar-ProductoOperacion-scaffold` | PA-022 | — | `285621b` | 2026-09-14 | Mergeado |
| #11 | `feature/pa-005-persistir-movimiento-stock` | PA-005 | — | `9475614` | 2026-09-14 | Mergeado |
| #16 | `feature/PA-012—Alinear-validaciones-y-errores-en-backend` | PA-012 | — | `0c11cee` | 2026-09-16 | Mergeado |
| #18 | `PA-018-Implementar-historial-precios` | PA-018 | — | `55c4279` | 2026-09-17 | Mergeado |
| #21 | `feature/PA-027-Implementar-SuperLínea-en-backend` | PA-027 | — | `77475d0` | 2026-09-21 | Mergeado |
| #25 | `PA-024-Implementar-Presentacion-en-backend-CR-002` | PA-024 | CR-002 | `01948a6` | 2026-09-22 | Mergeado |
| #27 | `PA-031` | PA-031 | — | `bf75fff` | 2026-09-22 | Mergeado |
| #29 | `PA-051-Implementar-bajoMinimo` | PA-051 | — | `1f84fc4` | 2026-09-23 | Mergeado a `develop` |
| #31 | `PA-029-—-Implementar-búsqueda-por-Denominación/Línea/SuperLínea-` | PA-029 | CR-004 | `3b31d83` | 2026-09-23 | Mergeado a `develop` |

### 4.2 PRs sin tarjeta PA-XXX (excepción de trazabilidad)

| PR | Rama | Contenido | Commit merge | Observación |
|---|---|---|---|---|
| #15 | `develop` | Sync develop → main | `b6d2b85` | Merge de rama de integración, no de feature |
| #23 | `testing` | Integración de testing | `9a69eba` | Idem |
| #24 | `test/politica-precio` | Tests de política de precio | `90ae5d1` | Sin tarjeta |
| #30 | `test/politica-precio` | Tests de política de precio | `0ca0f24` | Duplicado con #24; sin tarjeta |

### 4.3 Tarjetas sin PR identificable (excepción)

| Tarjeta | Commit(s) | Rama asociada | Observación |
|---|---|---|---|
| PA-001 | `a56d0af` | — | Sin PR |
| PA-002 | `18ccf22` | — | Sin PR |
| PA-003 | `97d81dc` | — | Sin PR |
| PA-006 | `3c224f0` | — | Sin PR; rama `feature/pa-006-...` ya mergeada vía #11 |
| PA-011 | `cb59265` + `c78268b` + `500fcf4` | `pa-011-alinear-validaciones-backend` | Merge `1b123c9` va en dirección contraria (`develop → rama`) |
| PA-016 | `6538073`, `2ffe47d`, `678d833` | — | Tres commits para la misma tarjeta, sin PR unificado |
| PA-020 | `d93c4ff` + `14a599b` + `1cfc2d2` + `30da0fa` + `6b40109` + `24931c4` | `testing` | 6 commits, integrados vía PR #23 (sin tarjeta) |
| PA-031 | — | ✅ vía #27 | OK |
| PA-035 | `7adb98c` (versión previa) | `pa-035-eventStorming` | Sin PR |
| PA-053, PA-055 | Varios | `PA-053-...` / `PA-055-...` | Integrados a `develop` vía `6013725` (sin PR) |
| PA-005 (rama) | — | ✅ vía #11 | OK |
| PA-014 | `a64269a` | `origin/origin/PA-014-integridad-producto` | Rama mal nombrada + sin PR |

### 4.4 Ramas abiertas sin merge a `main`

| Rama | Tarjeta | Estado |
|---|---|---|
| `develop` | — | Rama de integración |
| `origin/PA-051-Implementar-bajoMinimo` | PA-051 | Mergeada a `develop` (#29), no a `main` |
| `origin/test/politica-precio` | — | Sin tarjeta |
| `origin/testing` | PA-020 + otros | Sin PR, sin merge a `main` |

## 5. Merges y refactors principales

### 5.1 Merges relevantes

| Tipo | Commit | Descripción |
|---|---|---|
| PR merge | `3b31d83` | PR #31 — PA-029 (CR-004) → develop |
| PR merge | `1f84fc4` | PR #29 — PA-051 |
| PR merge | `bf75fff` | PR #27 — PA-031 |
| PR merge | `01948a6` | PR #25 — PA-024 (CR-002) |
| PR merge | `77475d0` | PR #21 — PA-027 (SuperLínea) |
| PR merge | `55c4279` | PR #18 — PA-018 (historial precios) |
| PR merge | `0c11cee` | PR #16 — PA-012 (validaciones) |
| PR merge | `9475614` | PR #11 — PA-005 (movimiento stock) |
| PR merge | `285621b` | PR #10 — PA-022 (scaffold) |
| PR merge | `af2c65b` | PR #7 — PA-046 (tests ignorados) |
| PR merge | `8db9326` | PR #8 — PA-015 (filtro proveedor) |
| PR merge | `0ca0f24`, `90ae5d1` | PR #30/#24 — test/politica-precio |
| PR merge | `9a69eba`, `b6d2b85` | PR #23, #15 — integración testing/develop |
| Release | `570974a` | Release 22/09/2026 |
| Release | `57d611a` | Release 21/09/2026 |
| Release | `3df76ab` | Release 14/09/2026 |
| Release | `66f7ee9` | Release 12/09/2026 |
| Hotfix merge | `ca846d4` | `hotfix/Problemas-con-JsonWebToken` → main |
| Hotfix merge | `f0dbf6d` | `hotfix/Merge-a-main-12-09` |
| Hotfix merge | `bce9653` | Historial de precios en edición directa |
| Hotfix merge | `b149d05` | Crear movimiento_stock en bases existentes |
| Tag merge | `abc5a1c` | `vProblemas-con-JsonWebToken` → develop |
| Tag merge | `d4427f0` | `vMerge-a-main-12-09` → develop |
| Sync | `d53aebf` | `main → develop` |
| Sync | `ad02103` | `origin/develop → testing` |
| Sync | `60ab24e`, `96d5901` | `develop` / `main` → testing |
| Sync | `9f5a3ed`, `a1ddf79`, `29fc2c9` | Integración PA-053/PA-055 |
| Sync | `1b123c9` | `develop → pa-011-...` |

### 5.2 Refactors identificados

| Commit | Descripción |
|---|---|
| `cec6105` | `refactor(producto): muevo el cálculo de precio al servicio` |
| `24931c4` | `fix(producto): reemplazo columnas *Id sueltas por el id de la relación` |
| `684c44a` | `feat: Presentacion VO y envase como catalogo` (impacto arquitectónico) |
| `d1a0f5a` | `chore: muevo backend a la raíz` |
| `9428d1f` | `chore: elimino node_modules del repositorio` |

### 5.3 Breaking changes

| Commit | Descripción | PR | CR/ADR |
|---|---|---|---|
| `1a076f3` | `fix(producto-operacion)!: retirar endpoints scaffold sin autenticación` | #10 | Sin CR documentado |

### 5.4 CRs documentados en commits

| CR | Tarjeta asociada | Commit(s) | PR |
|---|---|---|---|
| CR-002 | PA-024 | `684c44a`, `991cbca`, `01948a6` | #25 |
| CR-004 | PA-029 | `ce2aa10`, `3b31d83` | #31 |
| CR-005 | PA-031 | `248ab1e`, `4c2c8d6`, `a009cf8`, `e6292d7` | #27 |

## 6. Excepciones documentadas

| # | Excepción | Ubicación | Motivo | Impacto | Mitigación |
|---|---|---|---|---|---|
| E1 | Commits de PA-001/002/003 sin PR | `a56d0af`, `18ccf22`, `97d81dc` | Flujo inicial sin PR obligatoria | Trazabilidad incompleta | Documentar; exigir PR desde PA-040 |
| E2 | Commit `incial` (typo) | `e2b0130` | Commit inicial | Bajo (histórico) | No reescribir; documentar |
| E3 | Mensaje narrativo en fix | `d9851a2` | Debugging volcado al mensaje | Bajo | Documentar |
| E4 | Duplicado `chore: ignoro mis carpetas de opencode` | `5d0b0df`, `845bc90` | Doble commit idéntico | Bajo | Documentar |
| E5 | Rama mal nombrada | `origin/origin/PA-014-integridad-producto` | Error al hacer push | Medio | Renombrar |
| E6 | Rama PA-011 sin merge a develop visible | `pa-011-alinear-validaciones-backend` | Merge en dirección contraria (`1b123c9`) | **Alto** | Abrir PR `pa-011 → develop` |
| E7 | Uso de tags para merges | `abc5a1c`, `d4427f0`, `ca846d4`, `f0dbf6d` | Flujo de hotfix alternativo | Medio | Estandarizar hotfix vía PR + tag semántico |
| E8 | Breaking change sin CR asociado | `1a076f3` (`!`) | Retiro de scaffold | Alto | Vincular a CR/ADR |
| E9 | Commits sin tipo conventional | Ver §3.2 | Flujo mixto | Bajo | Aplicar convención |
| E10 | PA-016 con 3 commits y sin PR | `6538073`, `2ffe47d`, `678d833` | Trabajo fragmentado | Medio | Unificar en un PR |
| E11 | PRs #24 y #30 con la misma rama `test/politica-precio` | `90ae5d1`, `0ca0f24` | Duplicación de PR | Bajo | Confirmar cuál quedó mergeado |
| E12 | PRs sin tarjeta (#15, #23, #24, #30) | Varios | Merges de ramas de integración y tests | Medio | Aceptable para integración; documentar |
| E13 | Rama con em-dash y slashes | `PA-029-—-Implementar-búsqueda-por-Denominación/Línea/SuperLínea-` (PR #31) | Caracteres no ASCII + `/` rompe refs | Medio | Renombrar futuras ramas |
| E14 | PA-053 y PA-055 integrados a `develop` sin PR | `6013725` | Merge directo | Medio | Abrir PR retroactivo |
| E15 | Paquete de commits `docs(ia): ...` con scope inusual | Varios | Registro de decisiones asistidas por IA | Bajo | Definir convención de scope |
| E16 | Commits `test/ajuste de precio` con `/` | `b1502ec`, `473156b` | Uso incorrecto de conventional | Bajo | Documentar |
| E17 | PA-020 con 6 commits sin PR, integrados vía PR #23 (sin tarjeta) | `d93c4ff` + varios | Trabajo de testing | Medio | Documentar y asociar PR a tarjeta |
| E18 | Commits `Release <fecha>` sin tipo conventional | 4 releases | Flujo manual de release | Bajo | Usar `chore(release): ...` |

## 7. Cumplimiento de criterios de aceptación

| Criterio | Estado | Evidencia |
|---|---|---|
| Commits descriptivos y comprensibles | ⚠️ Parcial | §3 — mayoría OK, 18 excepciones documentadas |
| PRs relevantes vinculadas a PA-XXX/CR | ⚠️ Parcial | §4 — 11 PRs con tarjeta, 4 sin tarjeta, 6 tarjetas sin PR |
| Merges/refactors principales identificados | ✅ | §5 |
| Excepciones documentadas | ✅ | §6 (E1–E18) |
| Informe con evidencia o enlaces suficientes | ✅ | §2 |

**Resultado backend:** **Cumple con excepciones** — aceptable para cerrar PA-040 si se registran las excepciones y se acuerda flujo PR obligatorio a partir de ahora.

## 8. Enlaces de evidencia

- Repo: `https://github.com/RamaDoglio/cwtech-proyecto1-backend`
- PRs con tarjeta: `#7`, `#8`, `#10`, `#11`, `#16`, `#18`, `#21`, `#25`, `#27`, `#29`, `#31`
- PRs sin tarjeta: `#15`, `#23`, `#24`, `#30`
- Commits clave:
  - `6013725` — HEAD develop (Unificacion testing)
  - `570974a` — HEAD main (Release 22/09/2026)
  - `3b31d83` — PR #31 (PA-029 + CR-004)
  - `1f84fc4` — PR #29 (PA-051)
  - `bf75fff` — PR #27 (PA-031 + CR-005)
  - `01948a6` — PR #25 (PA-024 + CR-002)
  - `77475d0` — PR #21 (PA-027 SuperLínea)
  - `55c4279` — PR #18 (PA-018 historial precios)
  - `0c11cee` — PR #16 (PA-012 validaciones)
  - `9475614` — PR #11 (PA-005)
  - `285621b` — PR #10 (PA-022)
  - `af2c65b` — PR #7 (PA-046)
  - `cec6105` — refactor cálculo de precio
  - `1a076f3` — breaking change (retiro scaffold)
- CRs documentados: CR-002 (#25), CR-004 (#31), CR-005 (#27)
- Logs: `evidencias/PA-040/backend/*.txt`

## 9. Recomendaciones

1. **Abrir PR para `pa-011-alinear-validaciones-backend → develop`** (E6).
2. **Renombrar** `origin/origin/PA-014-integridad-producto` → `PA-014-integridad-producto` (E5).
3. **Vincular CR/ADR** al breaking change `1a076f3` (E8).
4. **Estandarizar hotfixes** vía PR + tag semántico, no vía merge de tags (E7).
5. **Abrir PR retroactivo para PA-053/PA-055** (E14).
6. **Unificar PA-016** en un solo PR (E10).
7. **Resolver duplicado #24/#30** (E11).
8. **Adoptar nombres de rama ASCII** sin em-dash ni slashes (E13).
9. **Adoptar Conventional Commits** y plantilla de PR con `Tarjeta: PA-XXX` / `CR: CR-XXX`.
10. **Definir convención de scope** para `docs(ia): ...` (E15).

---

## 10. Observaciones críticas

- **15 PRs detectados** (11 con tarjeta, 4 sin). Buena mejora respecto a la recolección anterior.
- **3 CRs documentados**: CR-002 (PA-024), CR-004 (PA-029), CR-005 (PA-031). Trazabilidad CR ↔ PR ↔ commit es buena en esos casos.
- **La rama `pa-011` no está integrada a `develop`** pese a tener commits y merge intermedio; es la excepción más riesgosa (E6).
- **`origin/origin/PA-014-...`** es un error de push evidente (E5).
- **Los commits de validaciones (PA-011)** están muy bien: `fix(validaciones): ...` con scope y mensaje específico. Es el estándar a replicar.
- **`PA-016` tiene 3 commits con formatos distintos** (`PA-16:`, `PA- 016`, `feat:PA-016-...`): falta unificación (E10).
- **`PA-029` (PR #31) tiene rama con em-dash y slashes**: rompe `git log --grep` y scripts (E13).
- **PA-053 y PA-055** se integraron a `develop` vía merge directo `6013725`, sin PR (E14).
- **El commit `1a076f3`** es un breaking change sin CR documentado (E8).
- **Los PRs de `test/politica-precio` (#24, #30)** aparecen duplicados con la misma rama (E11).
