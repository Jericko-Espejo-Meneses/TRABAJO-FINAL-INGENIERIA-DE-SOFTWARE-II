-- Actualización no destructiva para la base local ya creada.
-- Son coordenadas aproximadas de demo, no geocodificación de locales reales.
ALTER TABLE restaurants ALTER COLUMN latitude DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE restaurants ALTER COLUMN longitude DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN longitude DROP NOT NULL;

UPDATE restaurants AS r
SET latitude = v.latitude,
    longitude = v.longitude
FROM (VALUES
  ('rest-1', -12.1070::double precision, -76.9930::double precision),
  ('rest-2', -12.1180::double precision, -77.0305::double precision),
  ('rest-3', -12.1270::double precision, -77.0295::double precision),
  ('rest-4', -12.0970::double precision, -77.0370::double precision)
) AS v(id, latitude, longitude)
WHERE r.id = v.id;
