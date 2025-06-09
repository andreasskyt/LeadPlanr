-- Drop table and sequence if they exist
-- DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP SEQUENCE IF EXISTS users_id_seq;

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS users_id_seq;

-- Create table
CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default",
    first_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    phone character varying(20) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users OWNER to lp_user;
GRANT ALL ON TABLE public.users TO lp_user;

-- Index: users_email_idx

-- DROP INDEX IF EXISTS public.users_email_idx;

CREATE INDEX IF NOT EXISTS users_email_idx
    ON public.users USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: update_users_updated_at

-- DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE 
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
