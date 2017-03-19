DROP DATABASE IF EXISTS eatogather;
CREATE DATABASE eatogather;

\c eatogather;


CREATE TABLE hmfs (
    ID bigserial PRIMARY KEY,
    password text ,
    email text  UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    gender bit(1) NOT NULL, 
    phone text UNIQUE
);


INSERT INTO hmfs ( password, email, gender, first_name, last_name, phone )
  VALUES ('Azeem', 'azmaktr@gmail.com', B'1', 'Azeem', 'Akhter', '1234123');
