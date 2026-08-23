-- ============================================================
-- V1__create_gtfs_schema.sql
-- Telangana GTFS Schema
-- ============================================================

CREATE SCHEMA IF NOT EXISTS gtfs;

-- ============================================================
-- AGENCY
-- ============================================================

CREATE TABLE gtfs.agency (
    agency_id        TEXT PRIMARY KEY,
    agency_name      TEXT NOT NULL,
    agency_url       TEXT NOT NULL,
    agency_timezone  TEXT NOT NULL,
    agency_lang      VARCHAR(10) NOT NULL
);

-- ============================================================
-- CALENDAR
-- ============================================================

CREATE TABLE gtfs.calendar (
    service_id   TEXT PRIMARY KEY,
    start_date   INTEGER NOT NULL,
    end_date     INTEGER NOT NULL,

    monday       SMALLINT NOT NULL CHECK (monday IN (0,1)),
    tuesday      SMALLINT NOT NULL CHECK (tuesday IN (0,1)),
    wednesday    SMALLINT NOT NULL CHECK (wednesday IN (0,1)),
    thursday     SMALLINT NOT NULL CHECK (thursday IN (0,1)),
    friday       SMALLINT NOT NULL CHECK (friday IN (0,1)),
    saturday     SMALLINT NOT NULL CHECK (saturday IN (0,1)),
    sunday       SMALLINT NOT NULL CHECK (sunday IN (0,1))
);

-- ============================================================
-- ROUTES
-- ============================================================

CREATE TABLE gtfs.routes (
    route_id          TEXT PRIMARY KEY,
    route_short_name  TEXT NOT NULL,
    agency_id         TEXT NOT NULL,
    route_type        SMALLINT NOT NULL,

    CONSTRAINT fk_routes_agency
        FOREIGN KEY (agency_id)
        REFERENCES gtfs.agency (agency_id),

    CONSTRAINT chk_route_type
        CHECK (route_type >= 0)
);

-- ============================================================
-- STOPS
-- ============================================================

CREATE TABLE gtfs.stops (
    stop_id      TEXT PRIMARY KEY,
    stop_name    TEXT NOT NULL,
    zone_id      TEXT,
    stop_lat     DOUBLE PRECISION NOT NULL,
    stop_lon     DOUBLE PRECISION NOT NULL,
    stop_desc    TEXT,

    CONSTRAINT chk_stop_lat
        CHECK (stop_lat BETWEEN -90 AND 90),

    CONSTRAINT chk_stop_lon
        CHECK (stop_lon BETWEEN -180 AND 180)
);

-- ============================================================
-- TRIPS
-- ============================================================

CREATE TABLE gtfs.trips (
    route_id         TEXT NOT NULL,
    trip_id          BIGINT PRIMARY KEY,
    service_id       TEXT NOT NULL,
    direction_id     SMALLINT NOT NULL,
    trip_short_name  TEXT NOT NULL,

    CONSTRAINT fk_trips_route
        FOREIGN KEY (route_id)
        REFERENCES gtfs.routes (route_id),

    CONSTRAINT fk_trips_service
        FOREIGN KEY (service_id)
        REFERENCES gtfs.calendar (service_id),

    CONSTRAINT chk_direction_id
        CHECK (direction_id IN (0,1))
);

-- ============================================================
-- STOP TIMES
-- ============================================================

CREATE TABLE gtfs.stop_times (
    trip_id          BIGINT NOT NULL,
    stop_sequence    INTEGER NOT NULL,
    stop_id          TEXT NOT NULL,
    departure_time   TEXT NOT NULL,
    arrival_time     TEXT NOT NULL,
    timepoint        SMALLINT NOT NULL,

    CONSTRAINT pk_stop_times
        PRIMARY KEY (trip_id, stop_sequence),

    CONSTRAINT fk_stop_times_trip
        FOREIGN KEY (trip_id)
        REFERENCES gtfs.trips (trip_id),

    CONSTRAINT fk_stop_times_stop
        FOREIGN KEY (stop_id)
        REFERENCES gtfs.stops (stop_id),

    CONSTRAINT chk_stop_sequence
        CHECK (stop_sequence > 0),

    CONSTRAINT chk_timepoint
        CHECK (timepoint IN (0,1))
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_routes_agency_id
ON gtfs.routes (agency_id);

CREATE INDEX idx_routes_short_name
ON gtfs.routes (route_short_name);

CREATE INDEX idx_trips_route_id
ON gtfs.trips (route_id);

CREATE INDEX idx_trips_service_id
ON gtfs.trips (service_id);

CREATE INDEX idx_stop_times_trip_id
ON gtfs.stop_times (trip_id);

CREATE INDEX idx_stop_times_stop_id
ON gtfs.stop_times (stop_id);

CREATE INDEX idx_stops_stop_name
ON gtfs.stops (stop_name);