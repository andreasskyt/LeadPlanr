-- Table: public.location_cache

-- DROP TABLE IF EXISTS public.location_cache;

CREATE TABLE IF NOT EXISTS public.location_cache
(
    id integer NOT NULL DEFAULT nextval('location_cache_id_seq'::regclass),
    location text COLLATE pg_catalog."default" NOT NULL,
    lat double precision NOT NULL,
    "long" double precision NOT NULL,
    CONSTRAINT location_cache_pkey PRIMARY KEY (id),
    CONSTRAINT location_cache_location_key UNIQUE (location)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.location_cache
    OWNER to ulrik;

GRANT ALL ON TABLE public.location_cache TO fap_user;
