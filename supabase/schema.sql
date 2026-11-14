-- ==============================================================================
-- SCHEMA POSTGRESQL PARA PLATAFORMA REAL DE SUBASTAS AUTOMOTRICES EN VIVO
-- INCLUYE CONTROL ATÓMICO DE OFERTAS, PARTICIPANTES AUTORIZADOS Y RLS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'auctioneer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    status TEXT DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'negociando', 'listo_subasta', 'cerrado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    version TEXT,
    vin TEXT NOT NULL,
    lot_number TEXT UNIQUE NOT NULL,
    reference_url TEXT,
    engine TEXT,
    displacement TEXT,
    transmission TEXT,
    drivetrain TEXT,
    fuel TEXT,
    odometer NUMERIC NOT NULL DEFAULT 0,
    odometer_unit TEXT DEFAULT 'mi' CHECK (odometer_unit IN ('mi', 'km')),
    exterior_color TEXT,
    interior_color TEXT,
    title_type TEXT NOT NULL DEFAULT 'salvage',
    vehicle_condition TEXT NOT NULL DEFAULT 'run_and_drive',
    primary_damage TEXT,
    secondary_damage TEXT,
    has_keys BOOLEAN DEFAULT TRUE,
    location TEXT,
    equipment JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    est_retail_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: VEHICLE IMAGES
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'exterior' CHECK (category IN ('exterior', 'interior', 'motor', 'tablero', 'danos')),
    is_primary BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: AUCTION SESSIONS (Subastas en Vivo Reales)
CREATE TABLE IF NOT EXISTS public.auction_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'open', 'bidding', 'last_call', 'paused', 'sold', 'unsold', 'closed')),
    
    -- Snapshots inmutables de la ficha al momento de subastar
    vehicle_snapshot JSONB NOT NULL,
    client_snapshot JSONB,

    -- Parámetros del lote
    starting_price NUMERIC NOT NULL CHECK (starting_price >= 0),
    min_increment NUMERIC NOT NULL DEFAULT 100 CHECK (min_increment > 0),
    reserve_price NUMERIC DEFAULT 0,
    time_remaining_seconds INT NOT NULL DEFAULT 60,
    total_duration_seconds INT NOT NULL DEFAULT 60,

    -- Estado en tiempo real actualizado atómicamente
    current_price NUMERIC NOT NULL,
    current_winner_id UUID,
    current_winner_paddle TEXT,
    current_winner_name TEXT,
    current_bid_count INT NOT NULL DEFAULT 0,
    
    -- Control de tiempo del servidor
    server_timer_started_at TIMESTAMPTZ,
    last_bid_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Enlaces y Tokens de acceso
    room_token TEXT UNIQUE NOT NULL,
    is_token_revoked BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: AUCTION PARTICIPANTS (Participantes Reales con Paleta y Permiso)
CREATE TABLE IF NOT EXISTS public.auction_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.auction_sessions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    paddle_number TEXT NOT NULL, -- Ej: 'Paleta #102'
    location TEXT NOT NULL DEFAULT 'Online',
    participant_token TEXT UNIQUE NOT NULL,
    authorization_status TEXT NOT NULL DEFAULT 'approved' CHECK (authorization_status IN ('pending', 'approved', 'suspended', 'revoked')),
    max_bid_limit NUMERIC,
    deposit_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    UNIQUE(session_id, paddle_number)
);

-- 7. TABLA: AUCTION BIDS (Registro inmutable de ofertas reales en PostgreSQL)
CREATE TABLE IF NOT EXISTS public.auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.auction_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.auction_participants(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paddle_number TEXT NOT NULL,
    bidder_name TEXT NOT NULL,
    bidder_location TEXT NOT NULL,
    sequence_number INT NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, sequence_number)
);

-- 8. TABLA: AUCTION RESULTS
CREATE TABLE IF NOT EXISTS public.auction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES public.auction_sessions(id) ON DELETE CASCADE,
    lot_number TEXT NOT NULL,
    vehicle_summary TEXT NOT NULL,
    final_price NUMERIC NOT NULL,
    total_bids INT NOT NULL,
    winner_participant_id UUID REFERENCES public.auction_participants(id),
    winner_name TEXT NOT NULL,
    winner_paddle TEXT NOT NULL,
    is_reserve_met BOOLEAN DEFAULT TRUE,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- FUNCIÓN POSTGRESQL ATÓMICA: place_bid
-- Procesa y valida ofertas en el servidor evitando cualquier colisión o trampa
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.place_bid(
    p_session_id UUID,
    p_participant_token TEXT,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_participant RECORD;
    v_new_seq INT;
    v_bid_id UUID;
    v_new_time INT;
BEGIN
    -- 1. Bloquear la fila de la subasta para garantizar concurrencia atómica (SELECT FOR UPDATE)
    SELECT * INTO v_session
    FROM public.auction_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La sesión de subasta no existe';
    END IF;

    -- 2. Verificar que la subasta esté abierta y aceptando ofertas
    IF v_session.status NOT IN ('open', 'bidding', 'last_call') THEN
        RAISE EXCEPTION 'La subasta no está activa en este momento (Estado: %)', v_session.status;
    END IF;

    -- 3. Validar participante por su token seguro
    SELECT * INTO v_participant
    FROM public.auction_participants
    WHERE session_id = p_session_id AND participant_token = p_participant_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participante no reconocido o token inválido';
    END IF;

    IF v_participant.authorization_status != 'approved' THEN
        RAISE EXCEPTION 'El participante no cuenta con autorización para ofertar (Estado: %)', v_participant.authorization_status;
    END IF;

    -- 4. Comprobar límite de crédito si estuviera configurado
    IF v_participant.max_bid_limit IS NOT NULL AND p_amount > v_participant.max_bid_limit THEN
        RAISE EXCEPTION 'La oferta supera el límite crediticio autorizado ($%)', v_participant.max_bid_limit;
    END IF;

    -- 5. Comprobar que supere la oferta vigente y cumpla el incremento mínimo
    IF p_amount < (v_session.current_price + v_session.min_increment) THEN
        RAISE EXCEPTION 'Oferta insuficiente. Debe ser de al menos $% (Actual: $%, Incremento: $%)',
            (v_session.current_price + v_session.min_increment), v_session.current_price, v_session.min_increment;
    END IF;

    -- 6. Calcular siguiente número de secuencia
    v_new_seq := v_session.current_bid_count + 1;

    -- 7. Regla de reloj Copart VB3: si entra oferta en últimos segundos, restaurar a mínimo 10s
    v_new_time := GREATEST(v_session.time_remaining_seconds, 10);

    -- 8. Insertar la oferta en el historial inmutable
    INSERT INTO public.auction_bids (
        session_id,
        participant_id,
        amount,
        paddle_number,
        bidder_name,
        bidder_location,
        sequence_number,
        server_timestamp
    ) VALUES (
        v_session.id,
        v_participant.id,
        p_amount,
        v_participant.paddle_number,
        v_participant.display_name,
        v_participant.location,
        v_new_seq,
        NOW()
    )
    RETURNING id INTO v_bid_id;

    -- 9. Actualizar estado de la subasta atómicamente
    UPDATE public.auction_sessions
    SET 
        current_price = p_amount,
        current_winner_id = v_participant.id,
        current_winner_paddle = v_participant.paddle_number,
        current_winner_name = v_participant.display_name,
        current_bid_count = v_new_seq,
        time_remaining_seconds = v_new_time,
        status = 'bidding',
        last_bid_at = NOW(),
        updated_at = NOW()
    WHERE id = v_session.id;

    -- 10. Actualizar última actividad del participante
    UPDATE public.auction_participants
    SET last_seen_at = NOW()
    WHERE id = v_participant.id;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'bid_id', v_bid_id,
        'amount', p_amount,
        'sequence', v_new_seq,
        'paddle', v_participant.paddle_number,
        'bidder_name', v_participant.display_name,
        'time_remaining', v_new_time,
        'timestamp', NOW()
    );
END;
$$;
