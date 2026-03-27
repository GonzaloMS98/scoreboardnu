-- Create base users for the scoreboard app
-- Users: base1@camino.com through base5@camino.com
-- Password for all: camino123 (should be changed in production)

-- Note: In Supabase, users are created via the Auth API, not SQL
-- This script creates the profiles for the base users
-- The actual user creation must be done via Supabase Auth API or Dashboard

-- First, let's insert placeholder profiles that will be linked when users sign up
-- The profiles will be created automatically by the trigger when users sign up

-- Base user emails for reference:
-- base1@camino.com -> AIR FORCE 1 (CASTILLO DE SION)
-- base2@camino.com -> MATANGA
-- base3@camino.com -> GATO CORRIDO
-- base4@camino.com -> CACHIBOL
-- base5@camino.com -> DE AGUILITA

-- Admin user: admin@camino.com
