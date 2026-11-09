-- Run once against the existing database before starting the API with the
-- varchar role column in User. MODIFY keeps generated columns that depend on
-- role in place; TypeORM's synchronize implementation tries to drop/re-add
-- the column and MySQL rejects that operation.
ALTER TABLE `users`
  MODIFY COLUMN `role` VARCHAR(32) NULL;
