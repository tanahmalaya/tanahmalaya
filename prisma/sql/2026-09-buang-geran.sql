-- Fasa 4b pemisahan GERAN (25 Sep 2026) - GERAN kini dalam database GT sendiri.
--
-- JALANKAN FAIL INI DULU, BARU `prisma db push --accept-data-loss`. db push
-- akan tukar enum LoginActorType kepada MEMBER sahaja, dan itu gagal selagi
-- ada baris actorType = 'SELLER'.
--
-- Backup data GERAN: C:\Users\talha\projects\backups\geran-dari-tanahmalaya-2026-09-25.json
-- (semua rekod disahkan wujud dalam database GT sebelum fail ini ditulis).
--
-- Dev:        node --env-file=.env.local node_modules/prisma/build/index.js db execute --file prisma/sql/2026-09-buang-geran.sql --schema prisma/schema.prisma
-- Production: sama, tanpa --env-file - HANYA selepas diuji di dev.

DELETE FROM "LoginEvent" WHERE "actorType"::text = 'SELLER';
DELETE FROM "Setting" WHERE "key" LIKE 'gt\_%';
