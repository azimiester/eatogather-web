DROP DATABASE IF EXISTS eatogather;
CREATE DATABASE eatogather;

\c eatogather;


CREATE TABLE hmfs (
    ID bigserial PRIMARY KEY,
    username text NOT NULL,
    password text ,
    auth_key text ,
    email text  NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    gender bit(1) NOT NULL
);


INSERT INTO hmfs (username, password, auth_key, email, gender, first_name, last_name )
  VALUES ('Azeem', 'Dost', NULL, 'azmaktr@gmail.com', B'1', 'Azeem', 'Akhter');
