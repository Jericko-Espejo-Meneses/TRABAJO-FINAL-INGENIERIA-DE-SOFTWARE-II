# HealthExpress — Backend API (NestJS)

Plataforma backend completa desarrollada con **NestJS** y **TypeScript** para **HealthExpress**, basada en el 100% del Product Road Map oficial (Sprints 1 al 8).

---

## 🎯 Alcance Total del Road Map (Sprint 1 al Sprint 8)

### 🚀 Release 1
| Sprint | Épica | ID | Historia de Usuario | Puntos de Historia |
| :--- | :--- | :--- | :--- | :---: |
| **Sprint 1** | Registro y Autenticación | **HE-HU1-001** | Como usuario, necesito registrarme con mi correo o redes sociales | 5 |
| **Sprint 1** | Registro y Autenticación | **HE-HU10-010** | Como usuario, necesito iniciar sesión con mi correo o redes sociales | 3 |
| **Sprint 2** | Exploración y Recomendaciones | **HE-HU2-002** | Como usuario, necesito buscar restaurantes con opciones saludables | 5 |
| **Sprint 3** | Exploración y Recomendaciones | **HE-HU3-003** | Como usuario, necesito recibir recomendaciones de menús saludables | 8 |
| **Sprint 3** | Carrito, Pedidos y Pagos | **HE-HU4-004** | Como usuario, necesito agregar productos a mi carrito y gestionarlos | 5 |
| **Sprint 4** | Carrito, Pedidos y Pagos | **HE-HU8-008** | Como usuario, necesito confirmar mi pedido a partir del carrito | 8 |
| **Sprint 4** | Carrito, Pedidos y Pagos | **HE-HU9-009** | Como usuario, necesito seleccionar un método de pago y procesar el pago | 5 |
| **Sprint 4** | Donación Automática | **HE-HU5-005** | Como usuario, necesito que un porcentaje de mi compra se done automáticamente | 3 |

### 🌟 Release 2
| Sprint | Épica | ID | Historia de Usuario | Puntos de Historia |
| :--- | :--- | :--- | :--- | :---: |
| **Sprint 5** | Historial e Impacto Social | **HE-HU6-006** | Como usuario, necesito visualizar mi historial de pedidos y donaciones | 5 |
| **Sprint 6** | Notificaciones y Logros | **HE-HU7-007** | Como usuario, necesito recibir notificaciones sobre promociones y mis logros | 3 |
| **Sprint 7** | Perfil y Personalización | **HE-HU11-011** | Como usuario, necesito editar mi perfil (datos personales, preferencias) | 5 |
| **Sprint 7** | Perfil y Personalización | **HE-HU13-013** | Como usuario, necesito visualizar en tiempo real el estado de mi pedido | 5 |
| **Sprint 8** | Favoritos y Productos Detallados | **HE-HU12-012** | Como usuario, necesito agregar restaurantes o menús a una lista de favoritos | 5 |
| **Sprint 8** | Favoritos y Productos Detallados | **HE-HU14-014** | Como usuario, necesito visualizar el detalle nutricional y descripción del menú | 5 |

---

## 🚀 Arquitectura y Tecnologías

- **Framework**: [NestJS 10](https://nestjs.com/) (Arquitectura modular escalable).
- **Lenguaje**: TypeScript (ES2021).
- **Autenticación**: JWT (`@nestjs/jwt`, `passport`, `passport-jwt`, `bcryptjs`).
- **Validación y DTOs**: `class-validator`, `class-transformer`.
- **Documentación Interactiva**: Swagger / OpenAPI (`@nestjs/swagger`).
- **Pruebas Automatizadas**: Jest y `@nestjs/testing` (11 suites con más de 40 pruebas unitarias).

---

## 📂 Estructura del Repositorio

```text
healthexpress-backend/
├── src/
│   ├── common/
│   │   ├── decorators/           # @Public(), @CurrentUser()
│   │   ├── filters/              # Global Exception Filter
│   │   └── guards/               # JwtAuthGuard
│   ├── database/                 # Repositorio en memoria con fixtures saludables
│   ├── modules/
│   │   ├── auth/                 # Sprint 1: HU1-001 & HU10-010 (Email & Social Auth)
│   │   ├── users/                # Gestión de usuarios y perfiles
│   │   ├── restaurants/          # Sprint 2: HU2-002 (Búsqueda y filtros saludables)
│   │   ├── menus/                # Sprint 8: HU14-014 (Desglose nutricional exhaustivo y alérgenos)
│   │   ├── recommendations/      # Sprint 3: HU3-003 (Recomendaciones inteligentes)
│   │   ├── cart/                 # Sprint 3: HU4-004 (Carrito con balance nutricional)
│   │   ├── orders/               # Sprint 4: HU8-008 & Sprint 5: HU6-006 & Sprint 7: HU13-013
│   │   ├── payments/             # Sprint 4: HU9-009 (Pagos con tarjeta, Yape/Plin, efectivo)
│   │   ├── donations/            # Sprint 4: HU5-005 & Sprint 5: HU6-006 (Donación automática)
│   │   ├── notifications/        # Sprint 6: HU7-007 (Promociones y alertas de pedido)
│   │   ├── achievements/         # Sprint 6: HU7-007 (Gamificación e insignias)
│   │   ├── profile/              # Sprint 7: HU11-011 (Edición de perfil y direcciones)
│   │   └── favorites/            # Sprint 8: HU12-012 (Gestión de restaurantes y platos favoritos)
│   ├── app.module.ts             # Módulo principal
│   └── main.ts                   # Bootstrap con Swagger y configuraciones globales
├── test/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚙️ Puesta en Marcha

### 1. Requisitos Previos
- Node.js >= 18.x
- npm >= 9.x

### 2. Instalar y Compilar
```powershell
npm install
npm run build
```

### 3. Iniciar el Servidor
```powershell
npm run start:dev
```
- API Base: `http://localhost:3000/api/v1`
- Swagger UI interactivo: **`http://localhost:3000/api/docs`**

---

## 🧪 Pruebas Automatizadas
Ejecutar la totalidad de pruebas unitarias:
```powershell
npm test
```

---

## 📋 Catálogo Completo de Endpoints

### 🔐 Sprint 1: Registro y Autenticación
* `POST /api/v1/auth/register` — **HE-HU1-001**: Registro con correo y contraseña.
* `POST /api/v1/auth/social-register` — **HE-HU1-001**: Registro con redes sociales (Google, Facebook, Apple).
* `POST /api/v1/auth/login` — **HE-HU10-010**: Inicio de sesión con correo y contraseña.
* `POST /api/v1/auth/social-login` — **HE-HU10-010**: Inicio de sesión con redes sociales.
* `GET /api/v1/auth/me` — Perfil del usuario activo.

### 🥗 Sprint 2: Exploración de Restaurantes Saludables
* `GET /api/v1/restaurants/search` — **HE-HU2-002**: Búsqueda por dietas (`vegano`, `keto`, `sin gluten`), rating, tiempo y sello saludable.
* `GET /api/v1/restaurants` — Catálogo general.
* `GET /api/v1/restaurants/:id` — Ficha de restaurante y su catálogo de menú.
* `GET /api/v1/restaurants/categories` — Categorías y etiquetas dietéticas.

### 🍽️ Sprint 3: Menús y Recomendaciones Inteligentes
* `GET /api/v1/recommendations/menus` — **HE-HU3-003**: Recomendación por objetivos (`weight_loss`, `muscle_gain`, `keto`, `detox`), calorías máximas y proteína.
* `GET /api/v1/recommendations/personalized` — **HE-HU3-003**: Recomendaciones personalizadas para el usuario.
* `GET /api/v1/recommendations/featured` — Platos destacados del día recomendados por nutricionistas.

### 🛒 Sprint 3 y 4: Carrito y Confirmación de Pedidos
* `GET /api/v1/cart` — **HE-HU4-004**: Ver carrito con cálculo de subtotales y macronutrientes acumulados.
* `POST /api/v1/cart/items` — **HE-HU4-004**: Agregar producto al carrito.
* `PATCH /api/v1/cart/items/:itemId` — **HE-HU4-004**: Modificar cantidad o instrucciones.
* `DELETE /api/v1/cart/items/:itemId` — **HE-HU4-004**: Eliminar un producto.
* `DELETE /api/v1/cart` — **HE-HU4-004**: Vaciar carrito.
* `POST /api/v1/orders/checkout` — **HE-HU8-008**: Confirmar pedido a partir del carrito con dirección de entrega.

### 💳 Sprint 4: Pagos y Donación Automática
* `POST /api/v1/payments/process` — **HE-HU9-009**: Seleccionar método de pago (Tarjeta, Yape/Plin, Efectivo) y procesar el cobro.
* `GET /api/v1/payments/order/:orderId` — Comprobante y recibo de pago.
* `GET /api/v1/donations/foundations` — **HE-HU5-005**: Listar fundaciones beneficiarias de la donación automática (3%).

### 📊 Sprint 5: Historial e Impacto Social
* `GET /api/v1/orders/history` — **HE-HU6-006**: Historial de pedidos realizados.
* `GET /api/v1/donations/impact` — **HE-HU6-006**: Panel de impacto social (monto total donado, raciones generadas y causas).
* `GET /api/v1/donations/history` — **HE-HU6-006**: Historial de donaciones generadas por pedido.

### 🔔 Sprint 6: Notificaciones y Logros
* `GET /api/v1/notifications` — **HE-HU7-007**: Listar notificaciones recibidas (promociones, avisos, logros).
* `PATCH /api/v1/notifications/:id/read` — Marcar notificación como leída.
* `PATCH /api/v1/notifications/read-all` — Marcar todas como leídas.
* `GET /api/v1/achievements` — Catálogo de insignias y logros de alimentación saludable.
* `GET /api/v1/achievements/my-progress` — **HE-HU7-007**: Progreso e insignias desbloqueadas.

### 👤 Sprint 7: Perfil y Seguimiento en Tiempo Real
* `GET /api/v1/profile` — **HE-HU11-011**: Consulta de perfil, datos y preferencias dietéticas.
* `PATCH /api/v1/profile` — **HE-HU11-011**: Editar datos personales, metas de salud y restricciones.
* `POST /api/v1/profile/addresses` — Guardar nueva dirección de entrega.
* `DELETE /api/v1/profile/addresses/:addressId` — Eliminar dirección guardada.
* `GET /api/v1/orders/:id/track` — **HE-HU13-013**: Seguimiento en tiempo real con línea de tiempo, estado y repartidor.
* `POST /api/v1/orders/:id/advance-status` — Simulador de avance de estados en tiempo real.

### ❤️ Sprint 8: Favoritos y Productos Detallados
* `GET /api/v1/favorites` — **HE-HU12-012**: Listar restaurantes y menús favoritos del usuario.
* `POST /api/v1/favorites/toggle` — **HE-HU12-012**: Alternar favorito (agregar/quitar con un solo toque).
* `POST /api/v1/favorites/restaurants/:id` — **HE-HU12-012**: Agregar restaurante a favoritos.
* `DELETE /api/v1/favorites/restaurants/:id` — **HE-HU12-012**: Eliminar restaurante de favoritos.
* `POST /api/v1/favorites/menus/:id` — **HE-HU12-012**: Agregar plato a favoritos.
* `DELETE /api/v1/favorites/menus/:id` — **HE-HU12-012**: Eliminar plato de favoritos.
* `GET /api/v1/favorites/status` — **HE-HU12-012**: Consultar si un ítem está marcado como favorito.
* `GET /api/v1/menus/:id/nutritional-detail` — **HE-HU14-014**: Ficha nutricional completa (macronutrientes, micronutrientes, NutriScore, índice glucémico, ingredientes y método de preparación).
* `GET /api/v1/menus/allergens` — **HE-HU14-014**: Catálogo de alérgenos identificados en los platos.

---

## 👤 Credenciales de Demostración
- **Usuario**: `usuario.demo@healthexpress.com`
- **Contraseña**: `Password123!`
