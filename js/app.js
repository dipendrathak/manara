const API_URL = window.location.origin + '/api';

async function api(endpoint, options = {}) {
    try {
        const response = await fetch(API_URL + endpoint, options);
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

function initNewsTicker() {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;
    
    api('/notices?type=urgent').then(data => {
        if (data && data.length > 0) {
            ticker.innerHTML = data.map(n => `<a href="notices.html">${n.title} <span style="color:var(--danger)">(${n.publish_date})</span></a>`).join(' &nbsp;&nbsp;|&nbsp;&nbsp; ');
        } else {
            ticker.innerHTML = `<a href="#">हार्दिक स्वागत तथा अभिवादन !</a> &nbsp;&nbsp;|&nbsp;&nbsp; <a href="#">नगरपालिकाको आधिकारिक वेबसाइटमा तपाईलाई स्वागत छ।</a>`;
        }
    });
}

function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
}

function toNepaliDigits(num) {
    if (num === null || num === undefined) return '';
    const nepaliMap = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
    return num.toString().split('').map(char => nepaliMap[char] || char).join('');
}

function showToast(message, type = 'success') {
    // Prevent runtime failures from breaking page rendering
    if (typeof document === 'undefined') return;
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initTabs() {
    const tabGroups = document.querySelectorAll('.tabs-container');
    
    tabGroups.forEach(group => {
        const btns = group.querySelectorAll('.tab-btn');
        const contents = group.querySelectorAll('.tab-content');
        
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                
                btns.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                group.querySelector(`#${target}`).classList.add('active');
            });
        });
    });
}

// Profile Modal functionality
function initModals() {
    const modals = document.querySelectorAll('.profile-modal');
    const closeBtns = document.querySelectorAll('.modal-close');
    
    // Global function to open modal (used by inline onclick handlers)
    window.openProfileModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.profile-modal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close on outside click
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// Accordion functionality
function initAccordions() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        if (header) {
            header.addEventListener('click', () => {
                // Close all others
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                // Toggle current
                item.classList.toggle('active');
            });
        }
    });
}

// Animated Counters
function initCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    if (counters.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = parseInt(target.getAttribute('data-value'));
                if (isNaN(finalValue)) return;
                
                let startValue = 0;
                const duration = 2000;
                const stepTime = Math.max(duration / finalValue, 10);
                const stepValue = Math.max(Math.floor(finalValue / (duration / stepTime)), 1);
                
                const timer = setInterval(() => {
                    startValue += stepValue;
                    if (startValue >= finalValue) {
                        startValue = finalValue;
                        clearInterval(timer);
                    }
                    target.textContent = toNepaliDigits(startValue);
                }, stepTime);
                
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// Global Search
function initGlobalSearch() {
    const searchForm = document.getElementById('global-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchForm.querySelector('input').value;
            if (query) {
                alert('Search query: ' + query + '\\n(Search implementation will connect to global search API)');
                // window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        });
    }
}

// Print utility
window.printPage = function() {
    window.print();
};

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initNewsTicker();
    initHeroSlider();
    initTabs();
    initModals();
    initAccordions();
    initCounters();
    initGlobalSearch();
});
