ALTER TABLE calendar_accounts
  ALTER COLUMN access_token DROP NOT NULL; 

ALTER TABLE calendar_accounts
  ALTER COLUMN valid_from DROP NOT NULL;
