-- ============================================
-- Manarashiswa Nagarpalika Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS manarashiswa_nagarpalika;
USE manarashiswa_nagarpalika;

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Insert default admin (password: admin123)
TRUNCATE TABLE users;
INSERT INTO users (username, password, full_name, email, role) VALUES 
('admin', '$2a$10$8K1p/a0dR1xqM8k5iE6mKeZhXU1kGJdFnVIsLXNPQ8kD4BYGjkP2.', 'मुकेश कुमार यादव', 'suchanaadhikarimsm@gmail.com', 'admin');

-- Settings Table (for dynamic configuration)
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('site_name', 'मनराशिसवा नगरपालिका'),
('slogan', 'शिक्षा, स्वास्थ्य, कृषि र पुर्वाधार: समृद्धिको आधार'),
('phone', '+9779854033103'),
('email', 'manarasishwamun.gov@gmail.com'),
('address', 'मनराशिसवा नगरपालिका, महोत्तरी, मधेश प्रदेश'),
('population', '52191'),
('area', '49.78'),
('total_wards', '10'),
('total_households', '8541'),
('province', 'मधेश प्रदेश'),
('district', 'महोत्तरी');

-- Mayor and Officials
CREATE TABLE IF NOT EXISTS officials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    image_url VARCHAR(255),
    bio TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE officials;
INSERT INTO officials (name, designation, email, phone, bio, image_url, display_order) VALUES
('माेहन पाण्डेय', 'नगर प्रमुख', 'mohanpandeybholhi@gmail.com', '9854033101', 'युवा संस्कार शिविर समापन समारोह ।', 'https://picsum.photos/300/300?random=1', 1),
('शकुन्तला देवी', 'नगर उप प्रमुख', '', '', '', 'https://picsum.photos/300/300?random=2', 2),
('मुकेश कुमार यादव', 'सूचना अधिकारी', 'suchanaadhikarimsm@gmail.com', '9854033109', 'सूचनाको हक सम्बन्धी जानकारी', 'https://picsum.photos/300/300?random=3', 3);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    section VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    image_url VARCHAR(255),
    join_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE staff;
INSERT INTO staff (name, designation, section, phone, email, image_url) VALUES
('राम कुमार शर्मा', 'प्रमुख प्रशासकीय अधिकृत', 'प्रशासन', '9800000000', 'cao@manarashiswamun.gov.np', 'https://picsum.photos/200/200?random=11'),
('हरि प्रसाद दाहाल', 'लेखा अधिकृत', 'लेखा', '9800000001', 'account@manarashiswamun.gov.np', 'https://picsum.photos/200/200?random=12'),
('सिता थापा', 'इन्जिनियर', 'प्राविधिक', '9800000002', 'tech@manarashiswamun.gov.np', 'https://picsum.photos/200/200?random=13');

-- Wards
CREATE TABLE IF NOT EXISTS wards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ward_number INT UNIQUE NOT NULL,
    ward_name VARCHAR(100),
    chairman_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE wards;
INSERT INTO wards (ward_number, ward_name, chairman_name, phone) VALUES
(1, 'वडा नं. १', 'राम प्रवेश यादव', '9800000001'),
(2, 'वडा नं. २', 'श्याम सुन्दर साह', '9800000002'),
(3, 'वडा नं. ३', 'हरि नारायण सिंह', '9800000003'),
(4, 'वडा नं. ४', 'शिव शंकर ठाकुर', '9800000004'),
(5, 'वडा नं. ५', 'गौरी शंकर झा', '9800000005'),
(6, 'वडा नं. ६', 'रविन्द्र चौधरी', '9800000006'),
(7, 'वडा नं. ७', 'नन्द किशोर पटेल', '9800000007'),
(8, 'वडा नं. ८', 'रमेश कुमार मण्डल', '9800000008'),
(9, 'वडा नं. ९', 'दिपक शर्मा', '9800000009'),
(10, 'वडा नं. १०', 'सन्तोष महतो', '9800000010');

-- Services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE services;
INSERT INTO services (title, description, icon, category) VALUES
('घटना दर्ता', 'जन्म, मृत्यु, विवाह दर्ता सेवा', '📝', 'eGov'),
('सामाजिक सुरक्षा', 'सामाजिक सुरक्षा भत्ता व्यवस्थापन', '🛡️', 'eGov'),
('नागरिक वडापत्र', 'नागरिकको विवरण तथा अभिलेख', '📋', 'eGov'),
('स्वास्थ्य व्यवस्थापन', 'स्वास्थ्य सूचना प्रणाली', '🏥', 'eGov'),
('कर तथा शुल्क', 'कर भुक्तानी तथा विवरण', '💰', 'eGov'),
('बोलपत्र सूचना', 'सार्वजनिक खरीद तथा ठेक्का', '📦', 'Procurement');

-- Documents/Procedures
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_url VARCHAR(255),
    category ENUM('law', 'procedure', 'notice', 'report', 'other') DEFAULT 'procedure',
    publish_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE documents;
INSERT INTO documents (title, category, publish_date) VALUES
('साक्षरता अभियान सञ्चालन तथा साक्षर नगरपालिका घोषणा सम्बन्धी कार्यविधि, २०८१', 'procedure', '2026-05-26'),
('मनराशिसवा नगरपालिकाको घर नक्सा अभिलेखीकरण कार्यविधि,२०८२', 'procedure', '2026-04-27'),
('मनराशिसवा नगरपालिका आय ठेक्का व्यवस्थापन कार्यविधि, 2082', 'procedure', '2026-04-19'),
('मनराशिसवा नगरपालिका खेलकुद प्रवर्द्धन कार्यविधि, २०८१', 'procedure', '2026-02-26'),
('विद्यालय शिक्षक,बालविकास सहजकर्ता तथा विद्यालय कर्मचारी नियुक्ति सम्बन्धि कार्यविधि, २०८२', 'procedure', '2026-02-22');

-- Notices/News
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    content TEXT,
    notice_type ENUM('urgent', 'notice', 'news', 'procurement') DEFAULT 'notice',
    publish_date DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE notices;
INSERT INTO notices (title, content, notice_type, publish_date) VALUES
('सार्वजनिक खरीद / बोलपत्र सूचना', 'मिति २०८२ सम्म आवेदन दिनुहोस्।', 'procurement', '2026-06-28'),
('नागरिक वडापत्र अद्यावधिक', 'सबै नागरिकले आफ्नो विवरण अद्यावधिक गराउनुहोस्।', 'notice', '2026-06-25'),
('युवा संस्कार शिविर समापन', 'नगर प्रमुखको उपस्थितिमा समारोह सम्पन्न।', 'news', '2026-06-20'),
('घर नक्सा अभिलेखीकरण सम्बन्धी अत्यन्त जरुरी सूचना |', 'घर नक्सा अभिलेखीकरण सम्बन्धी अत्यन्त जरुरी सूचना', 'urgent', '2026-06-15');

-- Budget and Programs
CREATE TABLE IF NOT EXISTS budget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    fiscal_year VARCHAR(20) NOT NULL,
    budget_type ENUM('budget', 'plan', 'income_expenditure') DEFAULT 'budget',
    description TEXT,
    file_url VARCHAR(255),
    publish_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE budget;
INSERT INTO budget (title, fiscal_year, budget_type, publish_date) VALUES
('आ.व.२०८१-०८२ को आय व्यय विवरण', '2081/082', 'income_expenditure', '2026-06-01'),
('नगरस्तरीय योजना २०८१/०८२', '2081/082', 'plan', '2025-01-05'),
('आ.व २०८०/०८१ को वडा स्तरीय तथा नगर स्तरीय अन्य योजना', '2080/081', 'plan', '2023-12-10');

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200),
    image_url VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    event_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    report_type ENUM('annual', 'quarterly', 'hearing', 'testing') NOT NULL,
    file_url VARCHAR(255),
    publish_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location tracking for users
CREATE TABLE IF NOT EXISTS location_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy FLOAT,
    altitude FLOAT,
    speed FLOAT,
    heading FLOAT,
    device_info TEXT,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_tracked (tracked_at)
);

-- Route searches
CREATE TABLE IF NOT EXISTS route_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    origin_lat DECIMAL(10, 7),
    origin_lng DECIMAL(10, 7),
    origin_name VARCHAR(200),
    dest_lat DECIMAL(10, 7),
    dest_lng DECIMAL(10, 7),
    dest_name VARCHAR(200),
    route_distance FLOAT,
    route_duration FLOAT,
    transport_mode VARCHAR(20),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site statistics
CREATE TABLE IF NOT EXISTS site_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    date DATE UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);