# HealthExpress – Frontend (React + Vite)

## Ejecutar
```bash
npm install
npm run dev        # http://localhost:5173
```
Cuenta demo: `demo@healthyexpress.com` / `Demo1234`

## Donación (HE-HU5-005)
El porcentaje acordado es **3% del total de la compra**, incluido en el pago y sin
cobro adicional al cliente. Por ejemplo, de una compra de S/ 50 se destinan
S/ 1.50 a la donación y el cliente paga S/ 50. El monto se redondea a dos decimales.
La configuración predeterminada y `.env.example` usan `VITE_DONATION_PERCENTAGE=3`,
igual que el backend. Si existe un `.env` local, debe usar también ese valor.

La confirmación y el historial muestran el monto y beneficiario registrados por
el backend en `donation: { donationAmount, foundationName, percentage }`.
Si un pedido antiguo no contiene esos datos, se muestra que el detalle no está
disponible, sin inventar un monto o beneficiario. El resumen acumula todas las
donaciones, incluidas las históricas a otras fundaciones.

## Conectar con el backend
1. En la carpeta `frontend`, copia `.env.example` como `.env` (PowerShell: `Copy-Item .env.example .env`). Vite no lee `.env.example` automáticamente.
2. Confirma que `.env` tenga `VITE_USE_MOCK=false` y `VITE_API_URL=https://ingsoft-backend-1.onrender.com/api`.
3. Detén el frontend con `Ctrl+C` en su terminal y vuelve a iniciarlo con `npm run dev`.
4. El catálogo de PostgreSQL usa restaurantes demo del semillero; que sean demo no significa que la aplicación esté usando el mock del frontend.

El checkout HTTP crea el pedido en estado pendiente y luego llama a `POST /payments/process`. En el simulador, una tarjeta terminada en `0000` o un código de billetera `000000` produce un rechazo; puedes reintentar el mismo pedido con datos válidos. El frontend solo envía los últimos cuatro dígitos de la tarjeta, nunca el número completo.

| Servicio | Endpoint esperado |
|---|---|
| Login / registro | `POST /auth/login`, `POST /auth/register` → `{ token, usuario }` |
| Usuario actual | `GET /auth/me` (Bearer token) |
| Login social | `GET /auth/oauth/{google\|facebook\|apple}` |
| Buscar | `GET /restaurantes?q&tags&tipoComida&distanciaMax&lat&lng` |
| Detalle + menú | `GET /restaurantes/{id}` → incluye `productos[]` |
| Recomendaciones | `GET /recomendaciones`, `GET/PUT /usuarios/me/preferencias` |
| Editar perfil | `PUT /usuarios/me` con `{ nombre, direccion, biografia }` → usuario actualizado |
| Pedido | `POST /pedidos` crea un pedido pendiente, `POST /payments/process` lo confirma tras aprobar el pago, `GET /pedidos` |
| Donaciones | `GET /donaciones/resumen` → `{ total, cantidad }` |

Los nombres de campos (idUsuario, correo, idProducto, tipoComida…) siguen el diagrama de clases y
están aislados en `src/domain/mappers.js`: si el backend usa otros, solo se edita ese archivo.

## Arquitectura
```
src/
  core/        config (Singleton), http (Adapter + Decorator), container (Factory)
  domain/      reglas y modelos: filtros (Strategy), donación, mappers (Adapter)
  services/    contracts.js (abstracciones) + http/ (real) + mock/ (demo)
  payments/    Strategy + Factory de métodos de pago
  checkout/    Builder (pedido) + Facade (flujo de pago)
  cart/        CartStore (Observer)
  context/ hooks/ components/ pages/ utils/
```

## SOLID
- **S**: cada archivo tiene una sola razón de cambio (HttpClient solo red, TokenStorage solo token, validators solo reglas, páginas solo UI).
- **O**: nuevos métodos de pago o filtros se agregan registrando una clase/entrada, sin editar el checkout ni la UI.
- **L**: `Mock*Service` y `Http*Service` extienden el mismo contrato y son intercambiables.
- **I**: contratos pequeños (Auth, Restaurant, Recommendation, Order, Donation) en vez de un “ApiService” gigante.
- **D**: los componentes piden servicios por contexto (`useServices`); solo `container.js` conoce las implementaciones concretas.

## Patrones de diseño
| Tipo | Patrón | Dónde |
|---|---|---|
| Creacional | Singleton | `core/config.js`, `getServices()` |
| Creacional | Factory | `core/container.js`, `PaymentStrategyFactory` |
| Creacional | Builder | `checkout/OrderBuilder.js` |
| Estructural | Adapter | `HttpClient` (fetch) y `domain/mappers.js` (DTO ↔ UI) |
| Estructural | Decorator | `AuthHttpClient` (token + 401) |
| Estructural | Facade | `checkout/CheckoutFacade.js` |
| Comportamiento | Strategy | `payments/strategies.js`, `domain/restaurantFilters.js` |
| Comportamiento | Observer | `cart/CartStore.js` + `useSyncExternalStore` |
