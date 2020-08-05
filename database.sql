CREATE DATABASE ConfigDB;

CREATE TABLE Configuration (
  Config_ID SERIAL PRIMARY KEY,
  key1 VARCHAR(255),
  key2 VARCHAR(255),
  minFloat float,
  maxFloat float,
  value VARCHAR(255)
);
