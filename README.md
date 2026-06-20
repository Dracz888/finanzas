# Finanzas — App de finanzas personales

Aplicación móvil (PWA) hecha con React + Vite para registrar y gestionar finanzas
personales. Funciona offline e instalable en el celular. Los datos se guardan
localmente en el dispositivo (`localStorage`).

## Pestañas

### 1. Registro
Registro rápido de movimientos:
- **Fecha** (hoy por defecto, se puede cambiar para registros posteriores)
- **Categoría** (las creadas en Configuración)
- **Método de pago**: Dólares, Bs, Cop, Bancolombia, USDT
  *(Cop = pesos colombianos en efectivo, Bancolombia = pesos en el banco)*
- **Monto** en la moneda del método
- **Tasa** (la eliges tú; unidades locales por 1 USD)
- **Monto USD** = monto ÷ tasa, calculado automáticamente
  *(con Dólares o USDT la tasa es 1)*

### 2. Gestión
Resumen financiero:
- Indicadores principales: **Ingresos, Egresos, Gastos**
- **Resultado Neto** (ingresos − egresos − gastos)
- **Dinero disponible** por cada moneda/método
- Gráficos: comparativo de ingresos vs salidas, distribución de salidas por
  categoría (dona) y evolución mensual.
- Filtro por periodo (Todo, este mes, mes anterior o un mes concreto).

### 3. Configuración
Crear y eliminar **categorías**. Cada categoría tiene un **nombre** y un **tipo**:
Ingreso, Egreso o Gasto.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # linter
```
