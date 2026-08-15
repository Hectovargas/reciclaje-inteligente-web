---
name: dashboard-frontend
description: >-
  Construye el Centro de Control y panel de métricas en React/Vite o Next.js siguiendo el diseño EcoGridAI.
  Utilizar cuando se desarrollen interfaces del panel administrativo en apps/dashboard,
  visualización de métricas de reciclaje, horas pico, rendimiento de IA y mapas de calor por zonas.
---

# Dashboard Frontend Skill

Esta habilidad guía el desarrollo del **Centro de Control** administrativo en `apps/dashboard` para la plataforma **CleanCity / Reciclaje Inteligente Web**.

---

## 🎯 Objetivo y Alcance

Implementar interfaces analíticas de alto rendimiento, visualmente atractivas y con temática oscura moderna (**EcoGridAI / Dark Theme**), conectadas a los endpoints de telemetría y métricas del backend.

### ⛔ Límites Estrictos
- **Desarrolla componentes y vistas en `apps/dashboard` (React, TypeScript, CSS/Tailwind, Chart.js/Recharts).**
- **NO modifica endpoints del backend ni esquemas de base de datos.**
- **NO expone datos sensibles ni llaves privadas en el frontend.**

---

## 📊 Módulos y Métricas del Centro de Control

1. **Tarjetas de KPIs Principales**:
   - Total de material reciclado (Kg por tipo: Plástico, Papel, Metal, Vidrio).
   - Huella de carbono / Contaminación evitada ($CO_2$ equivalente).
   - Tasa de precisión y rendimiento del modelo de IA de visión.
   - Estado operativo de estaciones (activas, alertas de llenado, fuera de línea).

2. **Gráficos Analíticos de Rendimiento**:
   - **Horas Pico**: Distribución temporal de depósitos durante el día/semana.
   - **Frecuencia de Vaciado**: Intervalo promedio y alertas predictivas de mantenimiento.
   - **Distribución de Materiales**: Gráfico circular/dona con porcentajes de clasificación.

3. **Mapa de Calor por Zonas (*Zone Heatmap*)**:
   - Representación visual de actividad de reciclaje por zonas geográficas o fijas.
   - Interactividad: Selección de zona para navegar dinámicamente a la pestaña de detalle con el listado de estaciones asociadas.

---

## 🎨 Lineamientos de Diseño (EcoGridAI Theme)

- **Paleta de Colores**:
  - Fondo: Tonos oscuros profundos (`#0B0F19`, `#111827`, `#1F2937`).
  - Acentos Primarios: Verde esmeralda / Neón ecológico (`#10B981`, `#059669`).
  - Acentos Secundarios: Cian / Azul tecnológico (`#06B6D4`, `#3B82F6`) para métricas de IA y Blockchain.
  - Alertas: Ámbar (`#F59E0B`) para mantenimiento y Rojo (`#EF4444`) para fallos críticos.
- **Tipografía y Legibilidad**: Fuentes sans-serif limpias con jerarquía clara y espaciado equilibrado.
- **Estados Interactivos**: Animaciones suaves de hover, skeletons de carga en peticiones asíncronas y feedback visual inmediato.

---

## 🔄 Flujo de Trabajo

1. **Conexión de Servicios API**: Consumir endpoints de `/api/v1/dashboard/*` y `/api/v1/estaciones`.
2. **Componentización**: Crear componentes atómicos reutilizables (`StatCard`, `TrendChart`, `ZoneHeatmap`, `StationStatusTable`).
3. **Manejo de Estado**: Gestionar peticiones con React Query / SWR / Zustand para asegurar actualización de métricas en tiempo real.
4. **Verificación Responsive**: Asegurar perfecta visualización en pantallas de escritorio, monitores de sala de control y tablets.
