# Original User Request

## 2026-08-17T03:03:12Z

<USER_REQUEST>
Consolidar las aplicaciones `apps/dashboard` (React 18 + Vite) y `apps/pwa` (Next.js 14 App Router) en una única aplicación frontend Next.js modular con rutas segmentadas por rol (`/admin` y `/app`), middleware RBAC con `jose` sobre cookies httpOnly, CSS Scoping por layout, code-splitting estricto y soporte PWA aislado.

Working directory: /home/fefo/Documentos/GitHub/reciclaje-inteligente-web
Integrity mode: development

## Requirements

### R1. Estructura de Rutas y Migración de Componentes
Portar todos los componentes de administración del Dashboard hacia `src/app/admin/**` en Next.js (App Router), reemplazando `react-router-dom` por `next/navigation`, adaptando directivas `'use client'` y migrando variables de entorno (`VITE_` -> `NEXT_PUBLIC_`). Aplicar CSS scoping aislando `admin.css` y `pwa.css`.

### R2. Middleware RBAC y Autenticación Edge-Compatible (jose)
Implementar `middleware.ts` utilizando `jose` para validar el JWT en cookie `httpOnly` en Next.js Edge Runtime, protegiendo `/admin/**` exclusivamente para rol `ADMIN` y `/app/**` para usuarios autenticados.

### R3. Code-Splitting Estricto y Aislamiento de Dependencias
Asegurar mediante dynamic imports (`next/dynamic` con `ssr: false`) que dependencias pesadas exclusivas del Dashboard (`chart.js`, `react-chartjs-2`, mapas) no se incluyan en el bundle inicial de `/app`.

### R4. Aislamiento y Conservación del Service Worker PWA
Configurar `@ducanh2912/next-pwa` con `scope: "/app"` y `start_url: "/app"`, garantizando soporte offline, manifest y acceso a la cámara (`html5-qrcode`) sin interferir con las rutas administrativas de `/admin`.

### R5. QA, Linting y Verificación de Integración
Validar compilación completa (`next build`), ausencia de errores de tipos TypeScript, linter y ejecución exitosa de pruebas automatizadas sin alterar los endpoints del backend NestJS.

## Acceptance Criteria

### Control de Acceso y Rutas
- [ ] Peticiones a `/admin/**` sin rol `ADMIN` son redirigidas a `/login` o bloqueadas.
- [ ] Peticiones a `/app/**` son accesibles para ciudadanos autenticados y redirigidas a login si no hay sesión.
- [ ] La raíz `/` redirige de forma condicional según el rol del usuario autenticado.

### Rendimiento y Bundling
- [ ] El bundle de la ruta `/app` no importa ni contiene `chart.js` ni `react-chartjs-2`.
- [ ] Las vistas administrativas cargan dinámicamente sus gráficos en cliente.

### PWA & Experiencia Móvil
- [ ] `manifest.json` y Service Worker funcionan correctamente bajo `/app`.
- [ ] La vista `/offline` se muestra ante pérdida de conexión en `/app`.
- [ ] El componente de escaneo QR con cámara opera sin errores en Next.js.

### Calidad de Código
- [ ] `pnpm build` compila con éxito sin errores de TypeScript ni rutas rotas.
- [ ] Los nombres y contratos de la API REST de NestJS se mantienen 100% intactos.
</USER_REQUEST>
