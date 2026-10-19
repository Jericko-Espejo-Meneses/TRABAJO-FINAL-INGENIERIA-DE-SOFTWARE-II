# HealthExpress – Frontend (React + Vite)

## Ejecutar
```bash
npm install
npm run dev        # http://localhost:5173
```
Cuenta demo: `demo@healthyexpress.com` / `Demo1234`

## Conectar con el backend
1. En `.env` pon `VITE_USE_MOCK=false` y `VITE_API_URL=http://localhost:3000/api`.
2. Reinicia `npm run dev`. No hay que tocar ningún componente.

| Servicio | Endpoint (todos bajo `/api`) |
|---|---|
| Registro / login | `POST /auth/register`, `POST /auth/login` → `{ token, usuario }` |
| Usuario actual | `GET /auth/me` (Bearer token) |
| Buscar restaurantes y platos | `GET /restaurantes?q&tags&tipoComida&distanciaMax&lat&lng` |
| Información + menú | `GET /restaurantes/{id}?lat&lng` → incluye `productos[]` |
| Editar perfil | `PUT /usuarios/me` con `{ nombre, direccion, biografia }` → usuario actualizado |

Los nombres de campos (idUsuario, correo, idProducto, tipoComida…) siguen el diagrama de clases y
están aislados en `src/domain/mappers.js`: si el backend usa otros, solo se edita ese archivo.

## Alcance actual
1. Inicio y registro de sesión (HU1, HU10).
2. Inicio (feed): búsqueda por restaurantes y platos, filtros, e información/menú del restaurante (HU2).
3. Mi perfil: ver mis datos, editarlos (nombre, dirección, biografía) y cerrar sesión (HU11).

## Arquitectura
```
src/
  core/        config (Singleton), http (Adapter + Decorator), container (Factory)
  domain/      filtros (Strategy), mappers (Adapter)
  services/    contracts.js (abstracciones) + http/ (real) + mock/ (demo)
  context/ hooks/ components/ pages/ utils/
```
