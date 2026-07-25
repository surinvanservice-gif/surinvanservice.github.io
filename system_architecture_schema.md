# LINE Car Booking System: System Architecture & Design

## 1. System Workflow Logic

1.  **Rich Menu Interaction**: The user interacts with the 6-button Rich Menu in the LINE OA.
2.  **LIFF Initialization**:
    *   **Button 1 (Calendar)**: Opens LIFF. The app initializes, gets the `userId` via `liff.getProfile()`, and fetches vehicle availability for the current month.
    *   **Button 2 (Transfer)**: Sends a postback. The backend receives this and can pre-fill the "Job Type" when the user eventually opens the LIFF form.
    *   **Button 3 (Charter)**: Sends a Flex Message with sub-options. Clicking an option opens LIFF with a URL parameter (e.g., `?type=charter_fuel_inc`).
3.  **Booking Process (Inside LIFF)**:
    *   User selects an available date (Green/Clickable). Red dates are disabled.
    *   User fills in Time, Pickup/Drop-off, and Contact Info.
    *   Frontend validates inputs (e.g., 10-digit phone number).
4.  **Submission**:
    *   LIFF sends a POST request to the Backend API.
    *   Backend saves the record to PostgreSQL.
    *   Backend triggers the LINE Messaging API to send a "Booking Confirmation" Flex Message to the user.
    *   LIFF calls `liff.closeWindow()`.

## 2. Recommended Technology Stack

*   **Frontend**: HTML5, Tailwind CSS (for styling), JavaScript (Vanilla or Vue/React), **FullCalendar.js** (for the availability calendar), **LINE LIFF SDK**.
*   **Backend**: **Node.js with Express** (ideal for LINE's asynchronous webhooks and JSON-heavy payloads).
*   **Database**: **PostgreSQL** (Robust relational data for bookings and availability).
*   **External APIs**: LINE Messaging API (Flex Messages, Rich Menus), Google Maps JavaScript API (for location selection).

## 3. Database Schema (PostgreSQL)

```sql
-- Users Table (Synced from LINE Profile)
CREATE TABLE users (
    line_user_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20),
    type VARCHAR(50), -- e.g., 'Van', 'Sedan'
    is_active BOOLEAN DEFAULT TRUE
);

-- Bookings Table
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
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability View/Table (Optional, can be calculated on the fly)
-- For high traffic, use a cache or a specific availability table.
```

## 4. LINE Console Integration Instructions

1.  **Create a Provider**: In the [LINE Developers Console](https://developers.line.biz/), create a provider.
2.  **Create a Messaging API Channel**: This provides the `Channel Access Token` and `Channel Secret`.
3.  **Create a LIFF App**:
    *   Go to the "LIFF" tab in your Messaging API channel settings.
    *   Add a new LIFF app.
    *   **Size**: "Full" or "Tall" (Tall is recommended for forms).
    *   **Endpoint URL**: The URL where your frontend is hosted (e.g., Vercel, Netlify).
    *   **Scopes**: Enable `profile` and `openid`.
    *   **Bot Link**: Set to "Normal" to encourage users to add your OA.
4.  **Rich Menu**: Use the "Rich Menu Maker" in the LINE Official Account Manager or the Messaging API to upload your 6-button image and map coordinates to LIFF URLs or Postback actions.
