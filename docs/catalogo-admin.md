# Administración de restaurantes y platos

Ampliación posterior a R2, preparada sobre main e3487c9. Este paquete contiene los archivos cambiados con las rutas reales del repositorio.

## HU y permisos

- HE-HU15-015: el administrador de HealthExpress registra el restaurante y selecciona como responsable una cuenta existente registrada con correo y contraseña.
- HE-HU16-016: el responsable inicia sesión con su propia contraseña, abre «Mi restaurante» y agrega platos a sus locales. La API compara el identificador de la sesión con el responsable guardado en el restaurante. Ante otro responsable devuelve HTTP 403 antes de guardar el plato.
- Cada restaurante tiene como máximo un responsable. Una misma cuenta puede gestionar varios restaurantes. Los locales preexistentes permanecen visibles y sin responsable hasta que se les asigne uno. Esta ampliación cubre el alta de locales y platos. El administrador asigna el responsable al crear el restaurante.

## Integración y orden de despliegue

1. Descomprimir el paquete fuera del clon. Crear una rama desde main actualizado. En «cambios» están los archivos del repositorio: integrar backend, frontend, database, docs y la actualización del README. Si la base avanzó desde e3487c9, comparar los cambios antes de reemplazar archivos. Revisar git diff y llevar la rama a main mediante pull request.
2. Jimmy: aplicar database/catalog-owner.sql en el editor SQL del proyecto Supabase correspondiente, primero en una base de pruebas. Se crea la columna nullable restaurants."ownerId", con clave foránea a users.id e índice. El script puede repetirse. No requiere seed ni reset.
3. En el entorno de Render, CATALOG_ADMIN_USER_IDS contiene los ID exactos de las cuentas de administración central separados por comas. No incluir al dueño por ser dueño. Configurar JWT_SECRET como secreto privado aleatorio de al menos 32 caracteres (distinto del valor de ejemplo). Si hubo secretos reales publicados en archivos .env del repositorio, rotarlos y configurarlos en el servidor antes de usar cuentas privilegiadas. Usar la conexión del backend a la base migrada.
4. En backend: npm ci, npx prisma generate, npm run build, npm test -- --runInBand. Desplegar la nueva API con el cliente de Prisma regenerado. En frontend: npm ci, npm test, npm run build. Configurar VITE_USE_MOCK=false y VITE_API_URL con la URL del backend desplegado; publicar el build de la revisión nueva con el proceso existente de GitHub Pages. Si los servicios despliegan desde otros repositorios, comprobar que recibieron los mismos cambios.
5. Al estrenar la versión, cerrar sesión e iniciar sesión con contraseña. La sesión automática al registrarse y la sesión social no conceden permisos de administración. Nadie comparte una cuenta.

## Demostración y evidencia

1. Registrar previamente dos cuentas distintas (administrador y responsable). El administrador entra con contraseña, abre «Administrar catálogo», crea el local y selecciona la cuenta responsable por nombre y correo.
2. Desde otra sesión, el responsable entra con su correo y contraseña, abre «Mi restaurante», elige su local y publica un plato disponible con stock positivo. Anotar ambos identificadores.
3. Un cliente busca el local en el catálogo, abre su menú y comprueba que el plato y su precio permanecen después de recargar. El cliente no recibe permisos para cargar platos.
4. En un entorno autorizado de pruebas, verificar el caso de local ajeno con la suite de backend del catálogo. Está en backend/src/modules/catalog-admin/catalog-admin.spec.ts. Para la evidencia de la versión desplegada comprobar que una solicitud con la identidad del responsable dirigida al otro local recibe 403 y que su menú conserva los registros. Ocultar tokens y credenciales en las capturas.
5. Registrar en el informe versión real de frontend y backend, fecha de ejecución y evidencias. Los resultados automáticos adjuntos son locales, con identidad y persistencia simuladas en la suite HTTP. La migración fue comprobada por separado con un motor PostgreSQL desechable (PGlite).
