# Resultados del banco de pruebas — VXML Doctor

**Fecha:** 28 de septiembre de 2026 a las 17:13  
**Entorno:** Node v24.21.0 · win32/x64 · Intel(R) Core(TM) i9-14900KF · 32 núcleos · 63.8 GiB RAM  
**Corpus:** 66 documentos, 5.58 MiB, 9 pasadas medidas por motor (gc() entre pasadas, mediana).

## Resumen

| Implementación | Mediana (ms) | Mínimo | Máximo | MiB/s | vs. más rápido | Arranque (ms) | Primer análisis (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| JavaScript (referencia) | 121.4 | 94.5 | 124.0 | 46.0 | 2.76× | 1.98 | 25.90 |
| TypeScript | 112.3 | 99.0 | 114.5 | 49.7 | 2.55× | 1.48 | 24.96 |
| WebAssembly (Rust) | 44.0 | 43.4 | 44.1 | 126.8 | 1.00× | 1.59 | 10.19 |

## Mediana por documento (ms)

Ordenados de mayor a menor tamaño.

| Documento | Bytes | JS | TS | WASM |
|---|---:|---:|---:|---:|
| masivo-001.vxml | 1116403 | 28.0 | 28.3 | 8.6 |
| masivo-000.vxml | 1080833 | 27.6 | 27.5 | 8.3 |
| grande-001.vxml | 494891 | 8.0 | 8.0 | 3.5 |
| grande-002.vxml | 492838 | 8.3 | 7.2 | 3.5 |
| grande-003.vxml | 487156 | 7.4 | 7.4 | 3.4 |
| grande-000.vxml | 481102 | 9.9 | 12.6 | 3.5 |
| mediano-003.vxml | 79399 | 1.1 | 1.0 | 0.6 |
| mediano-010.vxml | 78646 | 1.1 | 0.9 | 0.6 |
| mediano-017.vxml | 76373 | 1.0 | 0.9 | 0.6 |
| mediano-007.vxml | 74879 | 1.0 | 0.9 | 0.5 |
| mediano-006.vxml | 74772 | 1.1 | 0.9 | 0.5 |
| mediano-018.vxml | 74555 | 1.0 | 0.9 | 0.5 |
| mediano-012.vxml | 73730 | 1.0 | 1.2 | 0.5 |
| mediano-014.vxml | 73476 | 1.0 | 0.9 | 0.5 |
| mediano-016.vxml | 72570 | 1.0 | 0.9 | 0.5 |
| mediano-005.vxml | 72544 | 1.0 | 0.9 | 0.5 |
| mediano-008.vxml | 71930 | 0.9 | 0.8 | 0.5 |
| mediano-011.vxml | 71904 | 1.0 | 0.9 | 0.5 |
| mediano-001.vxml | 71897 | 1.0 | 0.9 | 0.5 |
| mediano-002.vxml | 71068 | 1.0 | 0.9 | 0.5 |
| mediano-009.vxml | 71024 | 0.9 | 0.8 | 0.5 |
| mediano-004.vxml | 70949 | 1.0 | 0.9 | 0.5 |
| mediano-013.vxml | 70886 | 1.0 | 0.8 | 0.5 |
| mediano-019.vxml | 67702 | 0.9 | 0.8 | 0.5 |
| mediano-000.vxml | 66912 | 1.0 | 0.9 | 0.5 |
| mediano-015.vxml | 61796 | 0.8 | 0.7 | 0.5 |
| pequeno-031.vxml | 7869 | 0.1 | 0.1 | 0.1 |
| pequeno-028.vxml | 7806 | 0.1 | 0.1 | 0.1 |
| pequeno-003.vxml | 7804 | 0.1 | 0.1 | 0.1 |
| pequeno-021.vxml | 7496 | 0.1 | 0.1 | 0.1 |
| pequeno-006.vxml | 7372 | 0.1 | 0.1 | 0.1 |
| pequeno-038.vxml | 7195 | 0.1 | 0.1 | 0.1 |
| pequeno-023.vxml | 6965 | 0.1 | 0.1 | 0.1 |
| pequeno-002.vxml | 6861 | 0.1 | 0.1 | 0.1 |
| pequeno-011.vxml | 6851 | 0.1 | 0.1 | 0.1 |
| pequeno-015.vxml | 6743 | 0.1 | 0.1 | 0.1 |
| pequeno-018.vxml | 6728 | 0.1 | 0.1 | 0.1 |
| pequeno-026.vxml | 6601 | 0.1 | 0.1 | 0.1 |
| pequeno-025.vxml | 6492 | 0.1 | 0.1 | 0.1 |
| pequeno-012.vxml | 6491 | 0.1 | 0.1 | 0.1 |
| pequeno-013.vxml | 6487 | 0.1 | 0.1 | 0.1 |
| pequeno-020.vxml | 6486 | 0.1 | 0.1 | 0.1 |
| pequeno-016.vxml | 6471 | 0.1 | 0.1 | 0.1 |
| pequeno-034.vxml | 6453 | 0.1 | 0.1 | 0.1 |
| pequeno-000.vxml | 6301 | 0.1 | 0.1 | 0.1 |
| pequeno-001.vxml | 6290 | 0.1 | 0.1 | 0.1 |
| pequeno-030.vxml | 6250 | 0.1 | 0.1 | 0.1 |
| pequeno-033.vxml | 6244 | 0.1 | 0.1 | 0.1 |
| pequeno-036.vxml | 6186 | 0.1 | 0.1 | 0.1 |
| pequeno-005.vxml | 6114 | 0.1 | 0.1 | 0.1 |
| pequeno-004.vxml | 6075 | 0.1 | 0.1 | 0.1 |
| pequeno-010.vxml | 6038 | 0.1 | 0.1 | 0.0 |
| pequeno-035.vxml | 6005 | 0.1 | 0.1 | 0.1 |
| pequeno-019.vxml | 5927 | 0.1 | 0.1 | 0.1 |
| pequeno-008.vxml | 5762 | 0.1 | 0.1 | 0.0 |
| pequeno-027.vxml | 5603 | 0.1 | 0.1 | 0.0 |
| pequeno-039.vxml | 5595 | 0.1 | 0.1 | 0.1 |
| pequeno-029.vxml | 5418 | 0.1 | 0.1 | 0.0 |
| pequeno-024.vxml | 5383 | 0.1 | 0.1 | 0.0 |
| pequeno-037.vxml | 5370 | 0.1 | 0.1 | 0.0 |
| pequeno-009.vxml | 5324 | 0.1 | 0.1 | 0.0 |
| pequeno-017.vxml | 5318 | 0.1 | 0.1 | 0.0 |
| pequeno-014.vxml | 5125 | 0.1 | 0.1 | 0.0 |
| pequeno-007.vxml | 5110 | 0.1 | 0.1 | 0.0 |
| pequeno-032.vxml | 4687 | 0.1 | 0.1 | 0.0 |
| pequeno-022.vxml | 4664 | 0.1 | 0.1 | 0.0 |
