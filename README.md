# SGIAL-BAP – Prototipo funcional

Sistema web de Gestión de Inventario y Alertas Logísticas para el Banco de Alimentos Perú.
Prototipo académico (PMV) con datos de prueba. Curso: Administración de Proyectos de Software – UPN.

## Cómo ejecutarlo
Abrir `index.html` en el navegador (doble clic). No requiere instalación ni internet
(salvo la tipografía de Google Fonts, que es opcional).

## Estructura
- `index.html`  Estructura de la página.
- `css/styles.css`  Estilos (modo claro y oscuro automático).
- `js/app.js`  Toda la lógica del sistema.

## Funcionalidades (según el alcance del informe)
1. Panel: indicadores, cola FEFO y alertas.
2. Productos: registro de producto/lote (nombre, categoría, lote, cantidad, ingreso, vencimiento, ubicación).
3. Movimientos: entradas y salidas; la salida descuenta por FEFO.
4. Reportes: existencias, productos por vencer, resumen de movimientos.
5. Roles: Administrador (registra productos) y Operador (solo consulta).

## Lógica clave en `js/app.js`
- `seed()` crea los datos de prueba (fechas relativas a hoy).
- `dl(lote)` calcula los días que faltan para vencer.
- `est(lote)` define el estado: Vencido (<0), Crítico (≤7), Por vencer (≤30), Vigente.
- `fefo(producto)` devuelve los lotes vigentes ordenados por fecha de vencimiento (el más próximo primero).
- Formulario de salida: descuenta de cada lote en orden FEFO hasta cubrir la cantidad; no despacha lotes vencidos.
- `alerts()` genera alertas por vencimiento y por stock bajo (disponible < mínimo).
- Persistencia: `localStorage` del navegador (`save()` / `load()`). Botón "Restablecer datos de prueba" en Reportes.

## Limitaciones (coinciden con el alcance)
Sin integración con sistemas reales del BAP, sin datos reales, sin base de datos de servidor.
