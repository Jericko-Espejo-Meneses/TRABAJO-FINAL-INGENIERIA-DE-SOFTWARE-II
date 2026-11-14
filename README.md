# HealthExpress — Ingeniería de Software II

Proyecto final de Ingeniería de Software II de la Universidad de Lima, desarrollado por el Grupo 2. HealthExpress es una aplicación web para buscar restaurantes saludables, consultar sus menús y realizar pedidos. Al confirmar una compra, el usuario puede ver el total y el importe de la donación calculada para el World Food Programme.

El flujo de pago es simulado. La versión final calcula una donación equivalente al **3 % del total del pedido**. Por ejemplo, una compra de **S/ 28,00** genera un importe de **S/ 0,84** en la confirmación. La transferencia de fondos queda fuera del alcance de la demostración académica.

## Alcance del proyecto

El equipo organizó siete historias de usuario en dos releases, con dos sprints por release. La estimación revisada del proyecto fue de **26 puntos de historia (PH)**.

| Release | Sprint | Historias de usuario | Resultado previsto | PH |
|---|---|---|---|---:|
| R1 | S1 | `HE-HU1-001` Registro y `HE-HU10-010` Inicio de sesión | Crear una cuenta y acceder al sistema con las credenciales registradas. | 5 |
| R1 | S2 | `HE-HU2-002` Búsqueda de restaurantes | Consultar el catálogo y filtrar restaurantes saludables según los criterios de búsqueda. | 5 |
| R2 | S1 | `HE-HU4-004` Carrito y `HE-HU8-008` Confirmación del pedido | Gestionar los platos seleccionados, revisar el total y confirmar el pedido. | 8 |
| R2 | S2 | `HE-HU9-009` Pago y `HE-HU5-005` Donación | Seleccionar un método de pago simulado y visualizar la donación asociada a la compra. | 8 |

## Organización del repositorio

La rama **`main`** reúne el frontend, el backend y los archivos de base de datos. Cada aplicación tiene su propio `package.json` y se ejecuta desde su carpeta.

| Ruta | Contenido |
|---|---|
| [`frontend/`](./frontend/) | Aplicación web en React y Vite. Incluye las pantallas de acceso, catálogo, carrito, pago y confirmación. |
| [`backend/`](./backend/) | API REST en NestJS y TypeScript. Gestiona autenticación, catálogo, pedidos, pagos simulados y donaciones. |
| [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) | Modelo de datos utilizado por Prisma para acceder a PostgreSQL. |
| [`database/Script_database.sql`](./database/Script_database.sql) | Script SQL del proyecto para consultar la estructura de la base de datos. |

## Ejecutar el proyecto integrado

Se necesitan Git, Node.js con npm y acceso a una base PostgreSQL compatible con el esquema del proyecto. El equipo utiliza PostgreSQL en Supabase. Los comandos de configuración siguientes están escritos para PowerShell.

### 1. Descargar el repositorio

```powershell
git clone https://github.com/Jericko-Espejo-Meneses/TRABAJO-FINAL-INGENIERIA-DE-SOFTWARE-II.git
cd TRABAJO-FINAL-INGENIERIA-DE-SOFTWARE-II
```

### 2. Configurar e iniciar el backend

Desde la raíz del repositorio, abre una terminal y ejecuta:

```powershell
cd backend
Copy-Item .env.example .env
```

En `backend/.env`, configura los siguientes valores. Si ya tienes un `.env` configurado, conserva ese archivo.

| Variable | Valor o finalidad |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL que utilizará la aplicación. |
| `DIRECT_URL` | Cadena de conexión directa que requiere el esquema de Prisma. Añade esta variable si falta en la copia de `.env.example`. |
| `JWT_SECRET` | Clave privada del entorno para firmar los tokens de sesión. |
| `PORT` | Puerto de la API. Para la configuración local de este README, usa `3000`. |

Las credenciales se configuran en el entorno de cada instalación. Guarda el archivo `.env` únicamente en tu equipo.

Con la base del proyecto ya preparada, instala las dependencias, genera el cliente de Prisma e inicia la API:

```powershell
npm ci
npm run prisma:generate
npm run start:dev
```

Si vas a preparar **una base de pruebas nueva y vacía**, ejecuta `npm run prisma:push` desde `backend/` para aplicar el esquema y `npm run prisma:seed` para cargar el catálogo de ejemplo. El script de carga limpia registros existentes, por lo que debe utilizarse únicamente en una base destinada a pruebas.

La documentación interactiva de los endpoints queda disponible en [Swagger local](http://localhost:3000/api/docs). El prefijo principal de la API es `/api/v1`.

### 3. Configurar e iniciar el frontend

Deja el backend en ejecución y abre **una segunda terminal** en la raíz del repositorio:

```powershell
cd frontend
Copy-Item .env.example .env
```

Para probar la integración con el backend, configura `frontend/.env` así:

```dotenv
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3000/api
VITE_DONATION_PERCENTAGE=3
```

Instala las dependencias e inicia la aplicación:

```powershell
npm ci
npm run dev
```

Abre la dirección que Vite muestra en la terminal, normalmente [http://localhost:5173](http://localhost:5173). Reinicia Vite después de cambiar el archivo `.env`.

| Modo | Configuración | Uso |
|---|---|---|
| Integrado | `VITE_USE_MOCK=false` | El frontend envía solicitudes a la API configurada en `VITE_API_URL`. Para comprobar la persistencia, verifica el pedido en la base conectada al backend. |
| Simulado | `VITE_USE_MOCK=true` | Permite recorrer la interfaz con datos de prueba sin iniciar la API. |

### 4. Comprobar el flujo de compra

1. Registra una cuenta de prueba e inicia sesión.
2. Busca un restaurante y consulta su menú.
3. Agrega un plato al carrito y revisa las cantidades y el total.
4. Completa el pago simulado y abre la confirmación.
5. Comprueba el identificador del pedido y el cálculo del 3 %. Para validar la persistencia, busca **ese mismo identificador** en la tabla `orders` de la base de pruebas.

## Pruebas automatizadas

Ejecuta cada comando desde la carpeta indicada, después de instalar sus dependencias.

| Componente | Herramienta | Comando |
|---|---|---|
| Frontend | Vitest | `npm test` desde `frontend/` |
| Backend | Jest y utilidades de prueba de NestJS | `npm test -- --runInBand` desde `backend/` |
| Cobertura del backend | Jest | `npm run test:cov -- --runInBand` desde `backend/` |

El **11/11/2026**, sobre la versión de `main` identificada por el commit [`a76bdbc`](https://github.com/Jericko-Espejo-Meneses/TRABAJO-FINAL-INGENIERIA-DE-SOFTWARE-II/commit/a76bdbc), aprobaron **65 de 65 pruebas del backend en 11 suites**. El porcentaje de cobertura se obtiene por separado con `test:cov`.

Para generar la compilación del frontend o del backend, ejecuta `npm run build` desde la carpeta correspondiente.

## Equipo

| Integrante | Rol principal |
|---|---|
| Jericko Marcelo Espejo Meneses | Scrum Master |
| Rolando Gustavo Deudor Fernández | Product Owner |
| Fabrizzio Jhosue Gavilán Calderón | Líder técnico |
| Rodrigo Alessandro Sandoval Benites | Frontend |
| Piero Alessandro Berrios Mansilla | Backend |
| Jimmy Adrian Carrasco Ojeda | Base de datos |
| Aidan Abel Jesus Chiccori Sanchez | UI/UX |
| Víctor Alejandro Mendoza Domínguez | Aseguramiento de la calidad (QA) |

Las contribuciones de código se pueden consultar en el [historial de `main`](https://github.com/Jericko-Espejo-Meneses/TRABAJO-FINAL-INGENIERIA-DE-SOFTWARE-II/commits/main/). Las actividades de coordinación, diseño y validación también están documentadas en el informe final del proyecto.

## Administración del catálogo

[Historias, configuración y prueba de aceptación](docs/catalogo-admin.md)
