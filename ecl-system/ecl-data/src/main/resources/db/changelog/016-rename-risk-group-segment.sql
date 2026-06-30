--liquibase formatted sql
--changeset ecl:016
ALTER TABLE tbl_risk_group_detail
    CHANGE COLUMN business_line segment VARCHAR(32);
