CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    request_num INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    operator_id INTEGER,
    operator_name VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE
);