-- LINE Car Booking System: Database Schema (PostgreSQL)

-- 1. Users Table (Synced from LINE Profile)
CREATE TABLE users (
    line_user_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20),
    type VARCHAR(50), -- e.g., 'Van', 'Sedan'
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. System Settings Table (Base Rates & Payment Info)
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Settings
INSERT INTO system_settings (key, value) VALUES 
('charter_base_rate', '{"price": 3500, "hours": 10, "km_included": 200, "extra_km_rate": 15, "extra_hour_rate": 300}'),
('payment_config', '{"promptpay_id": "081-234-5678", "bank_accounts": [{"bank": "Bangkok Bank", "number": "123-4-56789-0"}]}');

-- 4. Booking Rules Table (Dynamic Pricing)
CREATE TABLE booking_rules (
    id SERIAL PRIMARY KEY,
    days_advance_min INT NOT NULL,
    days_advance_max INT,
    price_multiplier DECIMAL(3, 2) NOT NULL, -- e.g., 0.90 for 10% discount
    label VARCHAR(50)
);

INSERT INTO booking_rules (days_advance_min, days_advance_max, price_multiplier, label) VALUES
(30, 999, 0.90, 'Early Bird Special'),
(15, 29, 0.95, 'Advance Booking'),
(7, 14, 1.00, 'Standard Rate'),
(3, 6, 1.10, 'Urgent Booking'),
(0, 2, 1.20, 'Last Minute');

-- 5. Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(255) REFERENCES users(line_user_id),
    vehicle_id INT REFERENCES vehicles(id),
    job_type VARCHAR(50), -- 'Transfer', 'Charter_Fuel_Inc', 'Charter_Fuel_Exc'
    booking_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    social_contact VARCHAR(255),
    total_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Calendar Availability / Special Pricing
CREATE TABLE calendar_overrides (
    override_date DATE PRIMARY KEY,
    special_price DECIMAL(10, 2),
    is_closed BOOLEAN DEFAULT FALSE,
    note TEXT
);
