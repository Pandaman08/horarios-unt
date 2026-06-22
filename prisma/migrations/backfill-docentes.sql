-- Backfill para campos nuevos de Docente
-- Mapeo de modalidad -> condicion

UPDATE "Docente"
SET "condicion" = CASE
  WHEN LOWER("modalidad") = 'nombrado'
    THEN CAST('ORDINARIO' AS "CondicionDocente")
  WHEN LOWER("modalidad") = 'contratado'
    THEN CAST('CONTRATADO' AS "CondicionDocente")
  ELSE NULL
END
WHERE "condicion" IS NULL;

-- Mapeo de categoria -> categoriaDocente

UPDATE "Docente"
SET "categoriaDocente" = CASE
  WHEN LOWER("categoria") = 'principal'
    THEN CAST('PRINCIPAL' AS "CategoriaDocente")
  WHEN LOWER("categoria") = 'asociado'
    THEN CAST('ASOCIADO' AS "CategoriaDocente")
  WHEN LOWER("categoria") = 'auxiliar'
    THEN CAST('AUXILIAR' AS "CategoriaDocente")
  ELSE NULL
END
WHERE "categoriaDocente" IS NULL;

-- Establecer valor por defecto para regimenDedicacion (TC) para docentes nombrados

UPDATE "Docente"
SET "regimenDedicacion" = CAST('TC' AS "RegimenDedicacion")
WHERE "regimenDedicacion" IS NULL
  AND "condicion" = CAST('ORDINARIO' AS "CondicionDocente");