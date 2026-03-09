# Plataforma de Productividad — Frontend

Frontend de la **Plataforma de Evaluación de Desempeño por Indicadores**, una aplicación web diseñada para gestionar y dar seguimiento mensual a indicadores de productividad dentro de la organización.

Este sistema reemplaza el proceso actual basado en hojas de cálculo por una solución **centralizada, auditable y segura**, permitiendo registrar resultados mensuales, gestionar evidencias y visualizar dashboards de desempeño organizacional.

El frontend consume los servicios REST del backend desarrollado en **FastAPI** y utiliza **autenticación corporativa mediante Hydra IAM**, integrándose con el ecosistema de identidad de la organización.

---

# Objetivo del Proyecto

Digitalizar el proceso de evaluación mensual de desempeño organizacional, proporcionando:

- Trazabilidad de resultados
- Control de acceso basado en roles
- Integridad de datos
- Automatización del flujo mensual
- Visualización de indicadores y métricas

---

# Arquitectura General
Usuario
│
▼
Frontend (React)
│
│ REST API
▼
Backend (FastAPI)
│
├── PostgreSQL
├── Redis (futuro)
└── Hydra IAM (SSO corporativo)


El sistema utiliza una arquitectura desacoplada donde:

- **Hydra IAM** gestiona autenticación y acceso a la plataforma
- **FastAPI** gestiona lógica de negocio y RBAC interno
- **React** proporciona la interfaz de usuario

---

# Tecnologías

### Frontend

- React
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- Axios
- React Router

### Backend (integración)

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Hydra IAM (JWT Authentication)

---

# Modelo de Roles

El sistema utiliza **RBAC interno** con tres roles principales:

| Rol | Descripción |
|----|----|
| ADMIN | Configura estructura organizacional e indicadores |
| LEADER | Revisa y cierra evaluaciones de su equipo |
| EMPLOYEE | Registra resultados y evidencias |

Hydra IAM controla el acceso a la plataforma, mientras que el backend aplica los permisos internos.

---

# Funcionalidades

## Gestión Organizacional

- Unidades organizacionales jerárquicas
- Cargos asociados a unidades
- Usuarios vinculados a cargos
- Asignación de líderes

---

## Gestión de Indicadores

- Crear indicadores base
- Definir fórmula y frecuencia
- Configurar metas y pesos por cargo y año

---

## Seguimiento Mensual

Para cada indicador configurado se generan automáticamente:

- 12 registros mensuales por usuario
- Meta
- Peso
- Estado
- Porcentaje de cumplimiento

---

## Registro de Resultados

Los usuarios pueden:

- Registrar valores alcanzados
- Subir evidencias
- Crear planes de acción cuando no se cumple la meta

---

## Cierre Mensual

Los líderes pueden:

- Revisar resultados del equipo
- Cerrar evaluaciones mensuales
- Bloquear modificaciones posteriores

Una evaluación cerrada no puede ser editada.

---

## Dashboard

Visualización tipo Excel con:

- Vista anual por usuario
- Colores según cumplimiento
- Filtros por año
- Filtros por equipo

---

# Estructura del Proyecto
src
│
├── api
│ ├── users.js
│ ├── positions.js
│ ├── indicators.js
│
├── components
│ ├── tables
│ ├── forms
│ └── modals
│
├── features
│ ├── dashboard
│ ├── organization
│ ├── indicators
│ └── evaluations
│
├── hooks
│
├── context
│
├── pages
│
├── utils
│
└── App.jsx