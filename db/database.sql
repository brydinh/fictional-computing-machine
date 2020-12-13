CREATE DATABASE ValveAutomation;

CREATE TABLE ValveConfiguration (
  id SERIAL PRIMARY KEY,
  duration int,
  posted_timestamp timestamp,
  days_of_week boolean[7]
);
