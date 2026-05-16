-- backend/database/schema.sql
-- Smart Ration Distribution System Database Schema

CREATE TABLE IF NOT EXISTS RationShops (
    shop_id SERIAL PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    operator_name VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS Families (
    family_id SERIAL PRIMARY KEY,
    ration_card_number VARCHAR(50) UNIQUE NOT NULL,
    head_of_family_name VARCHAR(150) NOT NULL,
    village_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    default_face_member INT, -- Defined later to avoid circular dependency initially
    family_members_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FamilyMembers (
    member_id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES Families(family_id) ON DELETE CASCADE,
    member_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10),
    age INT,
    relationship VARCHAR(50),
    is_default_member BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for default_face_member in Families
ALTER TABLE Families 
ADD CONSTRAINT fk_default_face_member 
FOREIGN KEY (default_face_member) REFERENCES FamilyMembers(member_id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS FaceData (
    face_id SERIAL PRIMARY KEY,
    member_id INT NOT NULL REFERENCES FamilyMembers(member_id) ON DELETE CASCADE,
    family_id INT NOT NULL REFERENCES Families(family_id) ON DELETE CASCADE,
    face_embedding_vector TEXT NOT NULL, -- Storing as JSON array or Base64 since vector extensions might not be active
    face_image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MonthlyRation (
    ration_id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES Families(family_id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    received_status BOOLEAN DEFAULT FALSE,
    received_by_member_id INT REFERENCES FamilyMembers(member_id) ON DELETE SET NULL,
    received_time TIMESTAMP,
    shop_id INT REFERENCES RationShops(shop_id) ON DELETE SET NULL,
    admin_override BOOLEAN DEFAULT FALSE,
    
    -- Rule: Prevent double collection in the same month
    UNIQUE (family_id, month, year)
);
