SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'eatogather'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS eatogather;
CREATE DATABASE eatogather;

\c eatogather;


CREATE TABLE hmfs (
    ID bigserial PRIMARY KEY,
    password text NOT NULL,
    email text  UNIQUE,
    firstName text NOT NULL,
    lastName text NOT NULL,
    gender bit(1) NOT NULL, 
    phone text UNIQUE,
    bio text,
    location text,
    image text
);


INSERT INTO hmfs ( password, email, gender, firstName, lastName, phone, bio, location, image )
  VALUES ('Azeem', 'azmaktr@gmail.com', B'1', 'Azeem', 'Akhter', '1234123', NULL, NULL, NULL);

CREATE TABLE feasts (
	ID bigserial PRIMARY KEY,
	uid bigserial REFERENCES hmfs(ID) ON DELETE CASCADE,
	description text NOT NULL,
	title text NOT NULL,
	location text NOT NULL,
	tags text,
	created_at timestamptz NOT NULL DEFAULT now(),
	datetime timestamptz NOT NULL,
	noofguest int4 NOT NULL
);