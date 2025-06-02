ALTER TABLE calendar_accounts
  ADD COLUMN scopes character varying(2000),
  ADD COLUMN calendar_access boolean; 