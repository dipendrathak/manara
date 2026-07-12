const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

async function initDB() {
    const db = await open({
        filename: 'database.sqlite',
        driver: sqlite3.Database
    });

    console.log('Creating tables...');

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'editor',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS officials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            designation TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            image_url TEXT,
            bio TEXT,
            display_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            designation TEXT NOT NULL,
            section TEXT,
            phone TEXT,
            email TEXT,
            image_url TEXT,
            join_date DATE,
            is_active INTEGER DEFAULT 1,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_number INTEGER UNIQUE NOT NULL,
            ward_name TEXT,
            chairman_name TEXT,
            phone TEXT,
            email TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            category TEXT,
            is_active INTEGER DEFAULT 1,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT,
            category TEXT DEFAULT 'procedure',
            publish_date DATE,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            notice_type TEXT DEFAULT 'notice',
            publish_date DATE,
            expiry_date DATE,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            fiscal_year TEXT NOT NULL,
            budget_type TEXT DEFAULT 'budget',
            description TEXT,
            file_url TEXT,
            publish_date DATE,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            image_url TEXT NOT NULL,
            category TEXT,
            event_date DATE,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            report_type TEXT NOT NULL,
            file_url TEXT,
            publish_date DATE,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS location_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            accuracy REAL,
            altitude REAL,
            speed REAL,
            heading REAL,
            device_info TEXT,
            tracked_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS route_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            origin_lat REAL,
            origin_lng REAL,
            origin_name TEXT,
            dest_lat REAL,
            dest_lng REAL,
            dest_name TEXT,
            route_distance REAL,
            route_duration REAL,
            transport_mode TEXT,
            searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            subject TEXT,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dynamic_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            is_public INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dynamic_columns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            column_name TEXT NOT NULL,
            column_type TEXT NOT NULL,
            display_name TEXT NOT NULL,
            is_required INTEGER DEFAULT 0,
            display_order INTEGER DEFAULT 0,
            UNIQUE(table_name, column_name)
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            action TEXT NOT NULL,
            table_name TEXT,
            record_id TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            subtitle TEXT,
            image_url TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Inserting default data...');
    
    // Admin User
    await db.run('DELETE FROM users');
    const hash = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)', 
        ['admin', hash, 'Admin User', 'admin@example.com', 'admin']);

    // Settings
    await db.run('DELETE FROM settings');
    const settings = {
        'site_name': 'मनराशिसवा नगरपालिका',
        'slogan': 'शिक्षा, स्वास्थ्य, कृषि र पुर्वाधार: समृद्धिको आधार',
        'phone': '+9779854033103',
        'email': 'manarasishwamun.gov@gmail.com',
        'address': 'मनराशिसवा नगरपालिका, महोत्तरी, मधेश प्रदेश',
        'population': '52191',
        'area': '49.78',
        'total_wards': '10',
        'total_households': '8541',
        'province': 'मधेश प्रदेश',
        'district': 'महोत्तरी'
    };
    for (let [k, v] of Object.entries(settings)) {
        await db.run('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [k, v]);
    }

    // Officials
    await db.run('DELETE FROM officials');
    await db.run('INSERT INTO officials (name, designation, email, phone, image_url) VALUES (?, ?, ?, ?, ?)', ['माेहन पाण्डेय', 'नगर प्रमुख', 'mohanpandeybholhi@gmail.com', '9854033101', 'https://picsum.photos/300/300?random=1']);
    await db.run('INSERT INTO officials (name, designation, email, phone, image_url) VALUES (?, ?, ?, ?, ?)', ['शकुन्तला देवी', 'नगर उप प्रमुख', '', '', 'https://picsum.photos/300/300?random=2']);

    // Staff
    await db.run('DELETE FROM staff');
    await db.run('INSERT INTO staff (name, designation, section, phone, email, image_url) VALUES (?, ?, ?, ?, ?, ?)', ['राम कुमार शर्मा', 'प्रमुख प्रशासकीय अधिकृत', 'प्रशासन', '9800000000', 'cao@manarashiswamun.gov.np', 'https://picsum.photos/200/200?random=11']);

    // Wards
    await db.run('DELETE FROM wards');
    for (let i = 1; i <= 10; i++) {
        await db.run('INSERT INTO wards (ward_number, ward_name, chairman_name, phone) VALUES (?, ?, ?, ?)', [i, `वडा नं. ${i}`, 'वडा अध्यक्ष', `980000000${i}`]);
    }

    // Slides
    await db.run('DELETE FROM slides');
    await db.run('INSERT INTO slides (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)', 
        ['मनराशिसवा नगरपालिकामा स्वागत छ', 'शिक्षा, स्वास्थ्य, कृषि र पुर्वाधार: समृद्धिको आधार', 'https://picsum.photos/1920/1080?random=101', 1]);
    await db.run('INSERT INTO slides (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)', 
        ['हाम्रो सांस्कृतिक धरोहर', 'परम्परा र संस्कृतिको संरक्षण', 'https://picsum.photos/1920/1080?random=102', 2]);
    await db.run('INSERT INTO slides (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)', 
        ['विकास तर्फ लम्कदै', 'डिजिटल र समुन्नत नेपालको परिकल्पना', 'https://picsum.photos/1920/1080?random=103', 3]);

    // Dynamic Tables Dummy Data
    try {
        console.log('Initializing dummy dynamic tables...');
        // Clean up first
        await db.run("DROP TABLE IF EXISTS health_centers");
        await db.run("DELETE FROM dynamic_tables WHERE table_name = 'health_centers'");
        await db.run("DELETE FROM dynamic_columns WHERE table_name = 'health_centers'");

        // Create health_centers
        await db.run(`CREATE TABLE health_centers (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, name TEXT, ward REAL, contact TEXT, photo TEXT)`);
        await db.run(`INSERT INTO dynamic_tables (table_name, display_name, description, icon, is_public) VALUES ('health_centers', 'स्वास्थ्य चौकी', 'नगरपालिका भित्रका स्वास्थ्य चौकी तथा अस्पतालहरू', '🏥', 1)`);
        
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('health_centers', 'name', 'text', 'नाम', 1, 0)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('health_centers', 'ward', 'number', 'वडा नं', 0, 1)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('health_centers', 'contact', 'text', 'सम्पर्क', 0, 2)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('health_centers', 'photo', 'image', 'फोटो', 0, 3)`);

        // Insert some data
        await db.run(`INSERT INTO health_centers (name, ward, contact, photo) VALUES ('मनरा स्वास्थ्य चौकी', 1, '9800001111', 'https://picsum.photos/400/250?random=1')`);
        await db.run(`INSERT INTO health_centers (name, ward, contact, photo) VALUES ('शिसवा प्राथमिक स्वास्थ्य केन्द्र', 2, '9800002222', 'https://picsum.photos/400/250?random=2')`);
        await db.run(`INSERT INTO health_centers (name, ward, contact, photo) VALUES ('वडा नं ५ सामुदायिक क्लिनिक', 5, '9800003333', 'https://picsum.photos/400/250?random=3')`);


        await db.run("DROP TABLE IF EXISTS schools");
        await db.run("DELETE FROM dynamic_tables WHERE table_name = 'schools'");
        await db.run("DELETE FROM dynamic_columns WHERE table_name = 'schools'");

        // Create schools
        await db.run(`CREATE TABLE schools (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, school_name TEXT, principal TEXT, students REAL, photo TEXT)`);
        await db.run(`INSERT INTO dynamic_tables (table_name, display_name, description, icon, is_public) VALUES ('schools', 'विद्यालयहरू', 'सामुदायिक तथा संस्थागत विद्यालयहरूको विवरण', '🏫', 1)`);
        
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('schools', 'school_name', 'text', 'विद्यालयको नाम', 1, 0)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('schools', 'principal', 'text', 'प्रधानाध्यापक', 0, 1)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('schools', 'students', 'number', 'विद्यार्थी संख्या', 0, 2)`);
        await db.run(`INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES ('schools', 'photo', 'image', 'फोटो', 0, 3)`);

        // Insert some data
        await db.run(`INSERT INTO schools (school_name, principal, students, photo) VALUES ('श्री माध्यमिक विद्यालय मनरा', 'हरि प्रसाद शर्मा', 850, 'https://picsum.photos/400/250?random=4')`);
        await db.run(`INSERT INTO schools (school_name, principal, students, photo) VALUES ('श्री जनता आधारभूत विद्यालय', 'रिता कुमारी', 320, 'https://picsum.photos/400/250?random=5')`);

    } catch (e) {
        console.error('Error creating dummy dynamic tables', e);
    }

    console.log('Database initialization complete.');
    await db.close();
}

initDB().catch(console.error);
