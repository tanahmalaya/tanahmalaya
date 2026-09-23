-- Migrasi workflow LANDHUB (23 Sep 2026).
--
-- JALANKAN FAIL INI DULU, BARU `prisma db push`. Kalau db push dijalankan
-- dulu, Prisma nampak nilai enum lama hilang dan akan buang & cipta semula
-- enum StatusGeran - setiap penyenaraian kehilangan statusnya.
--
-- Dev:        node --env-file=.env.local node_modules/prisma/build/index.js db execute --file prisma/sql/2026-09-landhub-status.sql --schema prisma/schema.prisma
-- Production: sama, tanpa --env-file (guna .env) - HANYA selepas diuji di dev.
--
-- Setiap langkah selamat dijalankan semula (idempotent) - ia semak nilai lama
-- masih wujud sebelum tukar nama.

DO $$
BEGIN
  -- Status lama -> workflow baru, nama ditukar di tempat supaya setiap baris
  -- kekal dengan status setara tanpa UPDATE.
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'StatusGeran' AND e.enumlabel = 'MENUNGGU_SEMAKAN') THEN
    ALTER TYPE "StatusGeran" RENAME VALUE 'MENUNGGU_SEMAKAN' TO 'SUBMITTED';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'StatusGeran' AND e.enumlabel = 'DALAM_RUNDINGAN') THEN
    ALTER TYPE "StatusGeran" RENAME VALUE 'DALAM_RUNDINGAN' TO 'UNDER_REVIEW';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'StatusGeran' AND e.enumlabel = 'DISAHKAN') THEN
    ALTER TYPE "StatusGeran" RENAME VALUE 'DISAHKAN' TO 'PUBLISHED';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'StatusGeran' AND e.enumlabel = 'DITOLAK') THEN
    ALTER TYPE "StatusGeran" RENAME VALUE 'DITOLAK' TO 'REJECTED';
  END IF;

  -- Stok GeranTanah sendiri: PLT -> GT.
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'SumberGeran' AND e.enumlabel = 'PLT') THEN
    ALTER TYPE "SumberGeran" RENAME VALUE 'PLT' TO 'GT';
  END IF;
END $$;

-- Nilai baru. ADD VALUE tak boleh dalam blok DO bersama penggunaannya, jadi
-- berdiri sendiri; IF NOT EXISTS menjadikannya selamat diulang.
ALTER TYPE "StatusGeran" ADD VALUE IF NOT EXISTS 'DRAFT' BEFORE 'SUBMITTED';
ALTER TYPE "StatusGeran" ADD VALUE IF NOT EXISTS 'VERIFIED' AFTER 'UNDER_REVIEW';
ALTER TYPE "StatusGeran" ADD VALUE IF NOT EXISTS 'RESERVED' AFTER 'PUBLISHED';
ALTER TYPE "StatusGeran" ADD VALUE IF NOT EXISTS 'SOLD' AFTER 'RESERVED';
ALTER TYPE "StatusGeran" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Penyenaraian yang sudah tersiar sebelum migrasi: anggap tarikh siar =
-- tarikh cipta, supaya statistik dashboard tak kosong untuk data lama.
-- (Kolum publishedAt dicipta oleh db push, jadi langkah ini ada dalam
-- fail susulan 2026-09-landhub-backfill.sql.)
