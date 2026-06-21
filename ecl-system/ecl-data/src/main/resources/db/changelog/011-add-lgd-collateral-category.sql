--liquibase formatted sql
--changeset ecl:011
ALTER TABLE tbl_lgd_collateral_discount
    ADD COLUMN collateral_category VARCHAR(32) NOT NULL DEFAULT 'GENERAL' AFTER scheme_id;
