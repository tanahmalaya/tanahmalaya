-- Susulan migrasi LANDHUB - jalankan SELEPAS `prisma db push` (kolum
-- publishedAt baru wujud selepas itu). Selamat diulang.
UPDATE "Geran" SET "publishedAt" = "createdAt"
WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;
