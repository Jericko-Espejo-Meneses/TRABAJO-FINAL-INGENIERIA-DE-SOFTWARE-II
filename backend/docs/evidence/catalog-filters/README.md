# Distancia máxima y filtros del catálogo

## Comportamiento corregido

- `GET /api/restaurantes` y `/api/restaurantes/search` aplican todos los criterios.
- `distanciaMax` está en km; se calcula Haversine usando `latitude` y `longitude`
  del restaurante y `lat`/`lng` de la solicitud. Se compara antes de redondear.
- `nearby` significa como máximo 2 km; junto con `distanciaMax` gana el menor límite.
- `cheap` exige nivel de precio `$` (1 en PostgreSQL).
- `vegan`, `low-calorie` y `high-protein` reconocen sus etiquetas en español;
  se normalizan mayúsculas, acentos y separadores.
- Las etiquetas repetidas o separadas por comas se combinan con AND, también
  con búsqueda, categoría, precio, distancia y los filtros numéricos existentes.
- Si se solicita distancia sin coordenadas completas se responde HTTP 400.
  Restaurantes sin coordenadas válidas se excluyen únicamente al filtrar distancia.
- Una tabla vacía en PostgreSQL produce una lista vacía, no restaurantes de demo.

## Alcance de la evidencia

Prueba realizada el 8 de noviembre de 2026 con **VITE_USE_MOCK=false**.
El navegador llama al backend NestJS por HTTP. Los restaurantes marcados **QA**
son datos deterministas en memoria del servidor, no los mocks del frontend.
No se conectó ni modificó Supabase: falta el `.env` privado de una base de pruebas.
La lectura de coordenadas desde Prisma y el caso de tabla vacía se cubren en
`restaurants.service.spec.ts` con un doble de Prisma.

Ubicación de referencia: la predeterminada del frontend, Miraflores
(-12.1211, -77.0297). Las coordenadas QA son sintéticas y solo se cargan en el
servidor especial de prueba. No representan la ubicación real de esos negocios.
No conceder geolocalización durante esta reproducción para conservar ese origen.

| Captura | Criterios | Resultado |
|---|---|---|
| 01-sin-limite.jpg | Sin límite | 4 restaurantes: 0.5, 0.8, 1.5 y 2.5 km |
| 02-radio-1km.jpg | Máximo 1 km | GreenBowl y PureJuice |
| 03-filtros-combinados.jpg | Vegano + proteína + económico + ensaladas + 1 km | GreenBowl |
| 04-cerca-de-mi-2km.jpg | Cerca de mí + selector 3 km | 3 restaurantes, excluye 2.5 km |
| 05-sin-resultados.jpg | Vegana + Cerca de mí | Estado vacío |

## Reproducir en local

En `backend`, después de instalar dependencias y generar Prisma:

```powershell
node -r ts-node/register scripts/catalog-preview.ts
```

En otra terminal, dentro de `frontend`:

```powershell
$env:VITE_USE_MOCK='false'
$env:VITE_API_URL='http://127.0.0.1:3000/api'
npm run dev -- --host 127.0.0.1
```

Abrir `http://127.0.0.1:5173/login` y usar la cuenta demo definida en
`src/database/database.service.ts`. El servidor QA solo escucha en loopback,
no se despliega en producción y nunca conecta a Supabase.

En otra terminal del backend:

```powershell
node scripts/check-catalog.cjs
npm test -- --runInBand restaurants
```

`http-results.json` registra las respuestas verificadas y confirma que Vite
sirve `VITE_USE_MOCK=false`. Las credenciales y archivos `.env` no se publican.

Para probar Supabase, usar el arranque normal del backend con un `.env` local
válido y coordenadas reales en cada restaurante. Los valores predeterminados
iguales del esquema/seed no constituyen ubicaciones verificadas.
