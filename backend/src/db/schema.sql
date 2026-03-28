CREATE TABLE IF NOT EXISTS aishe_directory (
    aishe_code VARCHAR(50) PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    management_type VARCHAR(100),
    location_type VARCHAR(50),
    established_year INT,
    university_aishe_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aishe_state_district ON aishe_directory(state, district);