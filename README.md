# HealthExpress – Frontend (React + Vite)

## Ejecutar
```bash
npm install
npm run dev        # http://localhost:5173
```
Cuenta demo: `demo@healthyexpress.com` / `Demo1234`

## Conectar con el backend
1. En `.env` pon `VITE_USE_MOCK=false` y `VITE_API_URL=<url de tu API>`.
2. Reinicia `npm run dev`. No hay que tocar ningún componente.

| Servicio | Endpoint esperado |
|---|---|
| Login / registro | `POST /auth/login`, `POST /auth/register` → `{ token, usuario }` |
| Usuario actual | `GET /auth/me` (Bearer token) |
| Login social | `GET /auth/oauth/{google\|facebook\|apple}` |
| Buscar | `GET /restaurantes?q&tags&tipoComida&distanciaMax&lat&lng` |
| Detalle + menú | `GET /restaurantes/{id}` → incluye `productos[]` |
| Recomendaciones | `GET /recomendaciones`, `GET/PUT /usuarios/me/preferencias` |
| Pedido | `POST /pedidos` (incluye `montoDonacion`), `GET /pedidos` |
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
