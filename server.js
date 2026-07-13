require('dotenv').config();
const express = require('express');
const initSqlJs = require('sql.js');

const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'manarashiswa_secret_key_2026';

// Helper to determine database path (supporting read/write /tmp path on Vercel)
const getDatabasePath = () => {
    const localPath = path.join(__dirname, 'database.sqlite');
    if (process.env.VERCEL) {
        const tmpPath = path.join('/tmp', 'database.sqlite');
        if (!fs.existsSync(tmpPath)) {
            try {
                if (fs.existsSync(localPath)) {
                    fs.copyFileSync(localPath, tmpPath);
                    console.log('Copied database.sqlite template to /tmp');
                } else {
                    console.log('Local database.sqlite template not found.');
                }
            } catch (err) {
                console.error('Failed to copy database to /tmp:', err);
            }
        }
        return tmpPath;
    }
    return localPath;
};

// Helper to determine uploads directory path (supporting /tmp path on Vercel)
const getUploadsDir = () => {
    if (process.env.VERCEL) {
        const tmpUploads = path.join('/tmp', 'uploads');
        if (!fs.existsSync(tmpUploads)) {
            try {
                fs.mkdirSync(tmpUploads, { recursive: true });
            } catch (err) {
                console.error('Failed to create /tmp/uploads:', err);
            }
        }
        return tmpUploads;
    }
    const localUploads = path.join(__dirname, 'uploads');
    if (!fs.existsSync(localUploads)) {
        try {
            fs.mkdirSync(localUploads, { recursive: true });
        } catch (err) {
            console.error('Failed to create local uploads folder:', err);
        }
    }
    return localUploads;
};

// Database connection wrapper for SQLite (sql.js: pure JS, compatible with Vercel)
let sqlJsDb;
let sqlJsModulePromise;

const loadSqlJsModule = () => {
    if (!sqlJsModulePromise) {
        // In Node, locateFile should point to a local path (not an http URL).
        // sql.js package includes sql-wasm.wasm, so default locateFile is sufficient.
        sqlJsModulePromise = initSqlJs();
    }
    return sqlJsModulePromise;
};


const readDatabaseFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`SQLite database file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
};

const persistDatabaseFile = (dbInstance) => {
    const data = dbInstance.export();
    const buf = Buffer.from(data);
    const targetPath = getDatabasePath();
    fs.writeFileSync(targetPath, buf);
};

const getDb = async () => {
    if (sqlJsDb) return sqlJsDb;

    const SQL = await loadSqlJsModule();
    const filename = getDatabasePath();

    // Load once from disk
    const fileBuffer = readDatabaseFile(filename);
    const uint8 = new Uint8Array(fileBuffer);

    sqlJsDb = new SQL.Database(uint8);

    return sqlJsDb;
};

const pool = {
    execute: async (query, params = []) => {
        const dbInstance = await getDb();

        // Normalize a few MySQLisms used in your queries
        if (query.includes('ON DUPLICATE KEY UPDATE')) {
            query = query.replace('ON DUPLICATE KEY UPDATE setting_value = ?', 'ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?');
        }
        if (query.includes('NOW()')) {
            query = query.replace(/NOW\(\)/g, "datetime('now')");
        }

        const upper = query.trim().toUpperCase();

        if (upper.startsWith('SELECT')) {
            const stmt = dbInstance.prepare(query);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();
            return [rows];
        }

        // For non-SELECT, use run to execute updates.
        const normalizedParams = params.map((p) => (p === undefined ? null : p));
        dbInstance.run(query, normalizedParams);

        // Persist back to disk for Vercel (/tmp) and local.
        try {
            persistDatabaseFile(dbInstance);
        } catch (e) {
            console.error('Failed to persist sqlite database file:', e);
        }

        // Best-effort metadata mapping
        const changes = dbInstance.getRowsModified ? dbInstance.getRowsModified() : undefined;
        return [{ insertId: null, affectedRows: changes || null }];
    }
};


const logAudit = async (username, action, table_name, record_id, details) => {
    try {
        await pool.execute('INSERT INTO audit_log (username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)',
            [username, action, table_name, record_id, details ? JSON.stringify(details) : null]);
    } catch (e) {
        console.error('Audit log error', e);
    }
};

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Allow scripts/styles
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (process.env.VERCEL) {
    app.use('/uploads', express.static(path.join('/tmp', 'uploads')));
}

// Rate limiting for API only
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, getUploadsDir()),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SLIDES ROUTES
// ============================================
app.get('/api/slides', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM slides WHERE is_active = TRUE ORDER BY display_order');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/slides', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, subtitle, display_order } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        if (!image_url) return res.status(400).json({ error: 'Image is required' });
        
        await pool.execute('INSERT INTO slides (title, subtitle, image_url, display_order) VALUES (?, ?, ?, ?)',
            [title, subtitle, image_url, display_order || 0]);
        res.json({ message: 'Slide added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/slides/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE slides SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// SETTINGS ROUTES
// ============================================
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json(settings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            await pool.execute(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?',
                [key, value, value]
            );
        }
        res.json({ message: 'Settings updated' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/settings/logo', authenticateToken, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const logo_url = `/uploads/${req.file.filename}`;
        await pool.execute(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?',
            ['municipality_logo', logo_url, logo_url]
        );
        res.json({ message: 'Logo updated successfully', logo_url });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// OFFICIALS ROUTES
// ============================================
app.get('/api/officials', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM officials WHERE is_active = TRUE ORDER BY display_order, id');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/officials', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, designation, email, phone, bio } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO officials (name, designation, email, phone, bio, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, designation, email, phone, bio, image_url]);
        res.json({ message: 'Official added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/officials/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE officials SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// STAFF ROUTES
// ============================================
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM staff WHERE is_active = TRUE ORDER BY id');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/staff', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, designation, section, phone, email, join_date } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO staff (name, designation, section, phone, email, join_date, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, designation, section, phone, email, join_date || null, image_url]);
        res.json({ message: 'Staff added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/staff/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE staff SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// WARDS ROUTES
// ============================================
app.get('/api/wards', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM wards ORDER BY ward_number');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/wards', authenticateToken, async (req, res) => {
    try {
        const { ward_number, ward_name, chairman_name, phone, email, description } = req.body;
        
        // Upsert logic for ward based on ward_number
        const [existing] = await pool.execute('SELECT id FROM wards WHERE ward_number = ?', [ward_number]);
        if (existing.length > 0) {
            await pool.execute('UPDATE wards SET ward_name=?, chairman_name=?, phone=?, email=?, description=? WHERE ward_number=?', 
                [ward_name, chairman_name, phone, email, description, ward_number]);
            return res.json({ message: 'Ward updated' });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO wards (ward_number, ward_name, chairman_name, phone, email, description) VALUES (?, ?, ?, ?, ?, ?)',
            [ward_number, ward_name, chairman_name, phone, email, description]
        );
        res.status(201).json({ id: result.insertId, message: 'Ward created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/wards/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM wards WHERE id = ?', [req.params.id]);
        res.json({ message: 'Ward deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// SERVICES ROUTES
// ============================================
app.get('/api/services', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM services WHERE is_active = TRUE ORDER BY id');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/services', authenticateToken, async (req, res) => {
    try {
        const { title, description, icon, category } = req.body;
        await pool.execute('INSERT INTO services (title, description, icon, category) VALUES (?, ?, ?, ?)',
            [title, description, icon, category]);
        res.json({ message: 'Service added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE services SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// DOCUMENTS ROUTES
// ============================================
app.get('/api/documents', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        let query = 'SELECT * FROM documents WHERE is_active = TRUE';
        const params = [];
        if (category) { query += ' AND category = ?'; params.push(category); }
        query += ' ORDER BY publish_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (page - 1) * limit);

        const [rows] = await pool.execute(query, params);
        res.json({ data: rows, pagination: { page: parseInt(page), limit: parseInt(limit) } });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/documents', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { title, description, category, publish_date } = req.body;
        const file_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO documents (title, description, category, publish_date, file_url) VALUES (?, ?, ?, ?, ?)',
            [title, description, category, publish_date || new Date(), file_url]);
        res.json({ message: 'Document added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE documents SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// NOTICES ROUTES
// ============================================
app.get('/api/notices', async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM notices WHERE is_active = TRUE';
        const params = [];
        if (type) { query += ' AND notice_type = ?'; params.push(type); }
        query += ' ORDER BY publish_date DESC';
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/notices', authenticateToken, async (req, res) => {
    try {
        const { title, content, notice_type, publish_date, expiry_date } = req.body;
        await pool.execute('INSERT INTO notices (title, content, notice_type, publish_date, expiry_date) VALUES (?, ?, ?, ?, ?)',
            [title, content, notice_type, publish_date || new Date(), expiry_date || null]);
        res.json({ message: 'Notice added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/notices/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE notices SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// BUDGET ROUTES
// ============================================
app.get('/api/budget', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM budget WHERE is_active = TRUE ORDER BY publish_date DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/budget', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { title, fiscal_year, budget_type, description, publish_date } = req.body;
        const file_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO budget (title, fiscal_year, budget_type, description, file_url, publish_date) VALUES (?, ?, ?, ?, ?, ?)',
            [title, fiscal_year, budget_type, description, file_url, publish_date || new Date()]);
        res.json({ message: 'Budget added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/budget/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE budget SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// REPORTS ROUTES
// ============================================
app.get('/api/reports', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM reports WHERE is_active = TRUE ORDER BY publish_date DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reports', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { title, report_type, publish_date } = req.body;
        const file_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO reports (title, report_type, file_url, publish_date) VALUES (?, ?, ?, ?)',
            [title, report_type, file_url, publish_date || new Date()]);
        res.json({ message: 'Report added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE reports SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// GALLERY ROUTES
// ============================================
app.get('/api/gallery', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM gallery WHERE is_active = TRUE ORDER BY id DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/gallery', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, category, event_date } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.execute('INSERT INTO gallery (title, category, event_date, image_url) VALUES (?, ?, ?, ?)',
            [title, category, event_date || new Date(), image_url]);
        res.json({ message: 'Image added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/gallery/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('UPDATE gallery SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// CONTACT MESSAGES
// ============================================
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        await pool.execute('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, subject, message]);
        res.json({ message: 'Message sent' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/contact/messages', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY id DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/contact/messages', authenticateToken, async (req, res) => {
    try {
        const { name, phone, subject, message } = req.body;
        await pool.execute('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, '', phone, subject, message]);
        res.json({ message: 'Message added' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/contact/messages/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// STATS / DASHBOARD
// ============================================
app.get('/api/stats/public', async (req, res) => {
    try {
        const [settings] = await pool.execute("SELECT setting_value FROM settings WHERE setting_key IN ('population', 'area', 'total_wards', 'total_households')");
        // We'll just return setting directly for ease
        const [allSets] = await pool.execute('SELECT setting_key, setting_value FROM settings');
        const s = {};
        allSets.forEach(r => s[r.setting_key] = r.setting_value);
        res.json({
            population: s.population || 0,
            area: s.area || 0,
            wards: s.total_wards || 0,
            households: s.total_households || 0
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/stats/dashboard', authenticateToken, async (req, res) => {
    try {
        const queries = [
            'SELECT COUNT(*) as c FROM officials WHERE is_active=1',
            'SELECT COUNT(*) as c FROM staff WHERE is_active=1',
            'SELECT COUNT(*) as c FROM services WHERE is_active=1',
            'SELECT COUNT(*) as c FROM documents WHERE is_active=1',
            'SELECT COUNT(*) as c FROM notices WHERE is_active=1',
            'SELECT COUNT(*) as c FROM gallery WHERE is_active=1',
            'SELECT COUNT(*) as c FROM contact_messages',
            'SELECT COUNT(*) as c FROM budget WHERE is_active=1'
        ];
        
        const counts = await Promise.all(queries.map(q => pool.execute(q)));
        
        res.json({
            officials: counts[0][0][0].c,
            staff: counts[1][0][0].c,
            services: counts[2][0][0].c,
            documents: counts[3][0][0].c,
            notices: counts[4][0][0].c,
            gallery: counts[5][0][0].c,
            messages: counts[6][0][0].c,
            budget: counts[7][0][0].c
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// LOCATION TRACKING & ROUTING
// ============================================
app.post('/api/location/track', async (req, res) => {
    try {
        const { session_id, latitude, longitude, accuracy, altitude, speed, heading, device_info } = req.body;
        await pool.execute('INSERT INTO location_tracking (session_id, latitude, longitude, accuracy, altitude, speed, heading, device_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [session_id, latitude, longitude, accuracy, altitude, speed, heading, JSON.stringify(device_info)]);
        res.json({ message: 'Location tracked' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/route/search', async (req, res) => {
    try {
        const { session_id, origin_lat, origin_lng, origin_name, dest_lat, dest_lng, dest_name, route_distance, route_duration, transport_mode } = req.body;
        await pool.execute('INSERT INTO route_searches (session_id, origin_lat, origin_lng, origin_name, dest_lat, dest_lng, dest_name, route_distance, route_duration, transport_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [session_id, origin_lat, origin_lng, origin_name, dest_lat, dest_lng, dest_name, route_distance, route_duration, transport_mode]);
        res.json({ message: 'Route search saved' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// DYNAMIC DATABASE MANAGER (ADMIN ONLY)
// ============================================
app.get('/api/dynamic/tables', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM dynamic_tables ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/dynamic/tables', authenticateToken, async (req, res) => {
    try {
        if(req.user.role !== 'admin') return res.status(403).json({error: 'Admin only'});
        const { table_name, display_name, description, icon, is_public, columns } = req.body;
        
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table_name)) return res.status(400).json({ error: 'Invalid table name' });
        
        const [existing] = await pool.execute('SELECT * FROM dynamic_tables WHERE table_name = ?', [table_name]);
        if (existing.length > 0) return res.status(400).json({ error: 'Table already exists' });

        let createSql = `CREATE TABLE IF NOT EXISTS ${table_name} (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP`;
        
        const typeMapping = {
            'text': 'TEXT', 'number': 'REAL', 'date': 'DATE', 
            'email': 'TEXT', 'phone': 'TEXT', 'textarea': 'TEXT',
            'select': 'TEXT', 'image': 'TEXT', 'file': 'TEXT', 'boolean': 'INTEGER'
        };

        for (const col of columns) {
            const colName = col.column_name;
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(colName)) continue;
            const dbType = typeMapping[col.column_type] || 'TEXT';
            createSql += `, ${colName} ${dbType}`;
        }
        createSql += `)`;

        await pool.execute(createSql);
        await pool.execute('INSERT INTO dynamic_tables (table_name, display_name, description, icon, is_public) VALUES (?, ?, ?, ?, ?)',
            [table_name, display_name, description, icon, is_public ? 1 : 0]);
            
        let order = 0;
        for (const col of columns) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.column_name)) continue;
            await pool.execute('INSERT INTO dynamic_columns (table_name, column_name, column_type, display_name, is_required, display_order) VALUES (?, ?, ?, ?, ?, ?)',
                [table_name, col.column_name, col.column_type, col.display_name, col.is_required ? 1 : 0, order++]);
        }
        
        await logAudit(req.user.username, 'CREATE_TABLE', table_name, null, { display_name, columns });
        res.json({ message: 'Table created successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/dynamic/tables/:tableName', authenticateToken, async (req, res) => {
    try {
        if(req.user.role !== 'admin') return res.status(403).json({error: 'Admin only'});
        const tableName = req.params.tableName;
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });
        
        await pool.execute(`DROP TABLE IF EXISTS ${tableName}`);
        await pool.execute('DELETE FROM dynamic_tables WHERE table_name = ?', [tableName]);
        await pool.execute('DELETE FROM dynamic_columns WHERE table_name = ?', [tableName]);
        
        await logAudit(req.user.username, 'DROP_TABLE', tableName, null, null);
        res.json({ message: 'Table deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dynamic/schema/:tableName', async (req, res) => {
    try {
        const [tableInfo] = await pool.execute('SELECT * FROM dynamic_tables WHERE table_name = ?', [req.params.tableName]);
        if (tableInfo.length === 0) return res.status(404).json({ error: 'Table not found' });
        
        const [columns] = await pool.execute('SELECT * FROM dynamic_columns WHERE table_name = ? ORDER BY display_order', [req.params.tableName]);
        res.json({ table: tableInfo[0], columns });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// DYNAMIC DATA CRUD
// ============================================
app.get('/api/dynamic/data/:tableName', async (req, res) => {
    try {
        const tableName = req.params.tableName;
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });
        
        const [rows] = await pool.execute(`SELECT * FROM ${tableName} ORDER BY id DESC`);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/dynamic/data/:tableName', authenticateToken, upload.any(), async (req, res) => {
    try {
        const tableName = req.params.tableName;
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });
        
        const [columns] = await pool.execute('SELECT * FROM dynamic_columns WHERE table_name = ?', [tableName]);
        if (columns.length === 0) return res.status(404).json({ error: 'Table schema not found' });

        const cols = [];
        const vals = [];
        const placeholders = [];
        
        for (const [key, value] of Object.entries(req.body)) {
            const colDef = columns.find(c => c.column_name === key);
            if (colDef) {
                cols.push(key);
                vals.push(value);
                placeholders.push('?');
            }
        }
        
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const colDef = columns.find(c => c.column_name === file.fieldname);
                if (colDef && (colDef.column_type === 'image' || colDef.column_type === 'file')) {
                    cols.push(file.fieldname);
                    vals.push(`/uploads/${file.filename}`);
                    placeholders.push('?');
                }
            });
        }
        
        if (cols.length === 0) return res.status(400).json({ error: 'No valid data provided' });

        const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const [result] = await pool.execute(sql, vals);
        
        await logAudit(req.user.username, 'INSERT', tableName, result.insertId, req.body);
        res.json({ message: 'Record added successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/dynamic/data/:tableName/:id', authenticateToken, async (req, res) => {
    try {
        const { tableName, id } = req.params;
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });
        
        await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        await logAudit(req.user.username, 'DELETE', tableName, id, null);
        res.json({ message: 'Record deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// ADMIN EXTRAS (AUDIT, BACKUP)
// ============================================
app.get('/api/admin/audit-log', authenticateToken, async (req, res) => {
    try {
        if(req.user.role !== 'admin') return res.status(403).json({error: 'Admin only'});
        const [rows] = await pool.execute('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/backup', authenticateToken, (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({error: 'Admin only'});
    const file = getDatabasePath();
    res.download(file, `backup-${Date.now()}.sqlite`);
});

// Fallback to index.html for SPA if not an API route or static file
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server (only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Manarashiswa Nagarpalika Server running on port ${PORT}`);
        console.log(`📍 API: http://localhost:${PORT}/api`);
    });
}

module.exports = app;