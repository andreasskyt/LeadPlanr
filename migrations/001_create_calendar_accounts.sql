-- Drop table and sequence if they exist
-- DROP TRIGGER IF EXISTS update_calendar_accounts_updated_at ON public.calendar_accounts;
-- DROP TABLE IF EXISTS public.calendar_accounts CASCADE;
-- DROP SEQUENCE IF EXISTS calendar_accounts_id_seq;

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS calendar_accounts_id_seq;

-- Create table
CREATE TABLE IF NOT EXISTS public.calendar_accounts
(
    id integer NOT NULL DEFAULT nextval('calendar_accounts_id_seq'::regclass),
    provider character varying(50) COLLATE pg_catalog."default" NOT NULL,
    access_token text COLLATE pg_catalog."default",
    refresh_token text COLLATE pg_catalog."default",
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    oauth_id character varying(255) COLLATE pg_catalog."default",
    scopes character varying(2000) COLLATE pg_catalog."default",
    calendar_access boolean,
    CONSTRAINT calendar_accounts_pkey PRIMARY KEY (id),
    CONSTRAINT calendar_accounts_user_id_provider_oauth_id_key UNIQUE (user_id, provider, oauth_id),
    CONSTRAINT calendar_accounts_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.calendar_accounts OWNER to lp_user;
GRANT ALL ON TABLE public.calendar_accounts TO lp_user;

CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id
    ON public.calendar_accounts USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE OR REPLACE TRIGGER update_calendar_accounts_updated_at
    BEFORE UPDATE 
    ON public.calendar_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lp_user;
