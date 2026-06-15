# Dorado Club — Sistema de Gestión

Aplicación de gestión empresarial para **Dorado Club** (computadora y celular).
Ahora con **base de datos real** (los datos se guardan de verdad y se comparten
entre las gerencias).

## Arquitectura

- **Frontend:** React + Vite (PWA instalable).
- **Backend / API:** Node.js (`node:http`) — sin dependencias externas.
- **Base de datos:** SQLite integrado en Node (`node:sqlite`). El archivo vive en
  `data/dorado.db` y persiste entre reinicios. Cada gerencia entra con su usuario
  y los registros quedan guardados de forma centralizada.

No requiere instalar bases de datos ni servicios externos: con Node 22+ basta.

## Cómo ejecutar

```bash
npm install
npm run dev      # arranca API (puerto 8787) + frontend (puerto 5173) juntos
```

Abre **http://localhost:5173** en el navegador.

Para un solo proceso (producción / probar como quedaría desplegado):

```bash
npm start        # compila el frontend y lo sirve junto con la API en http://localhost:8787
```

Otros scripts: `npm run server` (solo API), `npm run dev:web` (solo frontend),
`npm run build` (compilar), `npm run lint`.

## Estado actual

### Fase 1 — Acceso (completado)
- Inicio de sesión por cargo (contraseñas cifradas con scrypt; sesiones por token).
- 10 cargos del sistema. Solo **Gerente General** y **Súper Intendente** crean
  cargos y perfiles. El personal no se registra por su cuenta.
- Administración: perfiles, cargos personalizados y auditoría.

### Fase 2 — Komplex Gym (completado) 🏋️
Primer módulo de gestión financiera conectado a la base de datos:
- **Ingresos por afiliación:** fecha, nombre, tipo (nuevo/renovación), plan,
  convenio, método de pago, tasa, monto → **Total USD** y **Diferencia** vs. el
  precio del plan se calculan solos.
- **Entrenadores personalizados:** registro de afiliados entrenados ($10 c/u).
- **Resumen** mensual/semanal: total, transacciones, nuevos vs. renovaciones,
  ticket promedio, ingresos por método y por plan, ranking de entrenadores.
- **Configuración:** planes y precios (normal / convenio, USD y Bs), entrenadores,
  tarifa por entrenamiento y descuento de convenio.

> Acceso al módulo: el **Gerente de Komplex Gym** registra y edita; **Administración**
> y los cargos ejecutivos lo ven en modo **solo lectura** (consolidado).

### Próximas fases
DFC, Sport Bar, Mercadeo, Condominio, Inmobiliaria, Administración (consolidado y
egresos) y los reportes (ingresos, gastos, novedades, mantenimiento, semanal/mensual/
trimestral/semestral/anual).

## Métodos de pago (base común)

Pago Móvil (Bs) · Zelle (USD, tasa 1) · Dólares (USD, tasa 1) · Bancolombia (COP) · COP.
Monto USD = Monto ÷ Tasa; si el método es en dólares, la tasa es siempre 1.

## Credenciales de prueba

Contraseña inicial de todos los perfiles: `dorado2026`.

| Cargo                  | Usuario             |
|------------------------|---------------------|
| Gerente General        | `gerencia.general`  |
| Súper Intendente       | `superintendente`   |
| Gerente Administrativo | `administracion`    |
| Gerente de Mercadeo    | `mercadeo`          |
| Gerente de RRHH        | `rrhh`              |
| Gerente Inmobiliaria   | `inmobiliaria`      |
| Gerente de Condominio  | `condominio`        |
| Gerente de Komplex Gym | `komplexgym`        |
| Gerente de DFC         | `dfc`               |
| Gerente de Sport Bar   | `sportbar`          |

## Despliegue

El backend sirve también el frontend ya compilado, así que para producción basta
desplegar este proyecto en cualquier host con Node 22+ (Render, Railway, Fly.io,
un VPS, etc.) y ejecutar `npm start`. Variables: `PORT` y `DB_PATH` (ruta del archivo
SQLite). Para respaldos, basta copiar el archivo `data/dorado.db`.
