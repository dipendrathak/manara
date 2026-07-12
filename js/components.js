let siteSettings = {};

function renderHeader(activePage = '', dynamicNavLinks = '') {
    const logoSrc = siteSettings.municipality_logo || 'assets/images/emblem_nepal.png'; 
    
    return `
    <div class="top-bar-exact">
        <div class="container exact-flex-between">
            <div class="top-socials">
                <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" class="social-icon"></a>
                <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/733/733590.png" alt="Twitter" class="social-icon"></a>
                
                <div class="live-time-container" style="margin-left: 15px;">
                    <div class="pulse-dot"></div>
                    <span id="nepali-datetime" style="font-weight: 600; color: #DC143C; font-size: 14px;"></span>
                </div>
            </div>
            <div class="top-contacts">
                <a href="tel:+9779854033103" style="color: inherit; text-decoration: none;"><span>📞 +9779854033103</span></a>
                <a href="mailto:manarasishwamun.gov@gmail.com" style="color: inherit; text-decoration: none;"><span>✉️ manarasishwamun.gov@gmail.com</span></a>
                <span>📠</span>
            </div>
        </div>
    </div>
    
    <header class="main-header-exact">
        <div class="container header-grid">
            <a href="index.html" class="logo-exact">
                <img src="${logoSrc}" alt="Emblem" class="emblem-img">
                <div class="logo-text-exact">
                    <h1>मनराशिसवा नगरपालिका</h1>
                    <p>शिक्षा, स्वास्थ्य, कृषि र पुर्वाधार: मनराशिसवा नगरपालिका समृद्धिको आधार</p>
                </div>
            </a>
            
            <div class="header-right-exact">
                <div class="search-box-exact">
                    <input type="text" placeholder="">
                    <button type="button">Search</button>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/500px-Flag_of_Nepal.svg.png" alt="Nepal Flag" class="flag-img-exact">
            </div>
        </div>
    </header>

    <nav class="main-nav-exact">
        <div class="container">
            <button id="mobile-menu-toggle" style="display:none; padding:15px; background:#fff; color:#333; border:none; width:100%; text-align:left; font-weight:bold; font-size:16px;">☰ मेनु (Menu)</button>
            <ul class="nav-menu-exact" id="nav-menu">
                <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">गृहपृष्ठ</a></li>
                <li>
                    <a href="#" class="${activePage === 'about' ? 'active' : ''}">परिचय ˅</a>
                    <ul class="dropdown-exact">
                        <li><a href="#">संगठनात्मक स्वरुप</a></li>
                        <li><a href="officials.html">जन प्रतिनिधि</a></li>
                        <li><a href="staff.html">कर्मचारी विवरण</a></li>
                    </ul>
                </li>
                <li><a href="ward.html" class="${activePage === 'wards' ? 'active' : ''}">वडा कार्यालयहरु ˅</a></li>
                <li>
                    <a href="#" class="${activePage === 'programs' ? 'active' : ''}">कार्यक्रम तथा परियोजना ˅</a>
                    <ul class="dropdown-exact">
                        <li><a href="budget.html">बजेट तथा कार्यक्रम</a></li>
                        <li><a href="budget.html">योजना तथा परियोजना</a></li>
                        <li><a href="budget.html">आय व्यय विवरण</a></li>
                    </ul>
                </li>
                <li>
                    <a href="services.html" class="${activePage === 'services' ? 'active' : ''}">विद्युतीय सुशासन सेवा ˅</a>
                    <ul class="dropdown-exact">
                        <li><a href="services.html">नागरिक वडापत्र</a></li>
                    </ul>
                </li>
                <li><a href="reports.html" class="${activePage === 'reports' ? 'active' : ''}">प्रतिवेदन ˅</a></li>
                <li>
                    <a href="notices.html" class="${activePage === 'notices' ? 'active' : ''}">सूचना तथा जानकारी ˅</a>
                    <ul class="dropdown-exact">
                        <li><a href="notices.html">सूचना तथा समाचार</a></li>
                        <li><a href="notices.html">सार्वजनिक खरिद/बोलपत्र</a></li>
                        <li><a href="documents.html">ऐन कानुन निर्देशिका</a></li>
                    </ul>
                </li>
                <li><a href="gallery.html" class="${activePage === 'gallery' ? 'active' : ''}">ग्यालरी</a></li>
                <li><a href="contact.html" class="${activePage === 'contact' ? 'active' : ''}">सम्पर्क</a></li>
                <li><a href="#">श्रम संचार प्रणाली</a></li>
            </ul>
        </div>
    </nav>
    <style>
    @media (max-width: 992px) {
        #mobile-menu-toggle { display: block !important; }
        .nav-menu-exact { display: none; }
        .nav-menu-exact.active { display: flex !important; flex-direction: column; }
    }
    </style>
    `;
}

function renderFooter() {
    const logoSrc = siteSettings.municipality_logo || 'assets/images/emblem_nepal.png';
    return `
    <footer class="main-footer">
        <div class="container grid-4">
            <div>
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                    <img src="${logoSrc}" alt="Logo" style="height: 60px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                    <h4 style="margin:0; border:none; padding:0; color:white; font-size: 20px;">मनराशिसवा नगरपालिका</h4>
                </div>
                <p style="color: #cbd5e1; margin-bottom: 20px;">शिक्षा, स्वास्थ्य, कृषि र पुर्वाधार: समृद्धिको आधार</p>
                <div style="color: #94a3b8; display: flex; flex-direction: column; gap: 8px;">
                    <p>📍 महोत्तरी, मधेश प्रदेश, नेपाल</p>
                    <p>📞 +977-9854033103</p>
                    <p>✉️ manarasishwamun.gov@gmail.com</p>
                </div>
                <div class="footer-flags">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/500px-Flag_of_Nepal.svg.png" alt="Nepal Flag">
                </div>
            </div>
            <div>
                <h4>महत्वपूर्ण लिङ्कहरु</h4>
                <ul>
                    <li><a href="https://nepal.gov.np" target="_blank">नेपाल सरकार</a></li>
                    <li><a href="https://madhesh.gov.np" target="_blank">मधेश प्रदेश सरकार</a></li>
                    <li><a href="https://mofaga.gov.np" target="_blank">संघीय मामिला मन्त्रालय</a></li>
                    <li><a href="https://moha.gov.np" target="_blank">गृह मन्त्रालय</a></li>
                </ul>
            </div>
            <div>
                <h4>द्रुत लिङ्कहरु</h4>
                <ul>
                    <li><a href="notices.html">सूचना तथा समाचार</a></li>
                    <li><a href="documents.html">ऐन कानुन तथा निर्देशिका</a></li>
                    <li><a href="services.html">नागरिक वडापत्र</a></li>
                    <li><a href="reports.html">प्रतिवेदन</a></li>
                    <li><a href="admin.html">एडमिन प्यानल</a></li>
                </ul>
            </div>
            <div>
                <h4>हाम्रो स्थान</h4>
                <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=85.75%2C26.65%2C85.78%2C26.68&amp;layer=mapnik&amp;marker=26.66699%2C85.76615" width="100%" height="180" style="border:none; border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></iframe>
            </div>
        </div>
        <div class="footer-bottom container">
            <p>&copy; ${new Date().getFullYear()} मनराशिसवा नगरपालिका. सबै अधिकार सुरक्षित।</p>
        </div>
    </footer>
    `;
}

async function initPage(activePage) {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');
    
    let dynamicNavLinks = '';
    
    try {
        // Fetch public settings for logo
        const statsRes = await fetch(window.location.origin + '/api/stats/public');
        if (statsRes.ok) {
            // Wait, /api/stats/public doesn't return the logo currently. We should use /api/settings.
            // But /api/settings is public? Let's check server.js. /api/settings is a simple GET, not protected by authenticateToken.
            const setRes = await fetch(window.location.origin + '/api/settings');
            if (setRes.ok) {
                siteSettings = await setRes.json();
            }
        }
        
        const res = await fetch(window.location.origin + '/api/dynamic/tables');
        if (res.ok) {
            const tables = await res.json();
            const publicTables = tables.filter(t => t.is_public);
            if (publicTables.length > 0) {
                dynamicNavLinks = `
                <li>
                    <a href="#" class="${activePage === 'dynamic' ? 'active' : ''}">विविध जानकारी ▼</a>
                    <ul class="dropdown">
                        ${publicTables.map(t => `<li><a href="dynamic-data.html?table=${t.table_name}">${t.display_name}</a></li>`).join('')}
                    </ul>
                </li>`;
            }
        }
    } catch(e) {
        console.error("Error loading header data:", e);
    }
    
    if (headerContainer) headerContainer.innerHTML = renderHeader(activePage, dynamicNavLinks);
    if (footerContainer) footerContainer.innerHTML = renderFooter();
    
    // Setup mobile menu
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if(menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}
