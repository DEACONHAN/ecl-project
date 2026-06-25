--liquibase formatted sql
--changeset ecl:015
ALTER TABLE tbl_ecl_job
    ADD COLUMN request_payload JSON NULL AFTER error_summary;
