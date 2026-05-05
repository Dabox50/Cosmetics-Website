document.addEventListener('DOMContentLoaded', () => {
    let productData = [];
    let categories = [];
    let currentCategory = 'All';

    const menuContainer = document.getElementById('menuContainer');
    const menuCategories = document.getElementById('menuCategories');
    const offlineBadge = document.getElementById('offlineBadge');
    const infoModal = document.getElementById('infoModal');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.getElementById('closeModal');

    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1";
    
    // SET THIS TO FALSE to use the LOCAL server data while working locally
    const USE_LIVE_DATA_LOCALLY = true;

    const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
        ? `http://${window.location.hostname}:5000/api` 
        : "https://cosmetics-website.fly.dev/api";

    // Update offline status
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineBadge.innerText = "Online - Live Data";
            offlineBadge.style.background = "#4caf50";
        } else {
            offlineBadge.innerText = "Offline Mode - Cached Data";
            offlineBadge.style.background = "#ff9800";
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Fetch Products and Categories
    const fetchData = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for Fly.io cold starts

        try {
            const [prodRes, catRes] = await Promise.all([
                fetch(`${API_BASE}/products`, { signal: controller.signal }),
                fetch(`${API_BASE}/categories`, { signal: controller.signal })
            ]);

            clearTimeout(timeoutId);

            productData = await prodRes.json();
            const cats = await catRes.json();
            
            // Update cache for products
            if (productData && productData.length > 0) {
                localStorage.setItem('shayorsInventory', JSON.stringify(productData));
            } else {
                const cached = localStorage.getItem('shayorsInventory');
                if (cached) productData = JSON.parse(cached);
            }

            // Update cache for categories
            if (cats && cats.length > 0) {
                categories = cats;
                localStorage.setItem('shayorsCategories', JSON.stringify(categories));
            } else {
                const cachedCats = localStorage.getItem('shayorsCategories');
                if (cachedCats) categories = JSON.parse(cachedCats);
            }

            renderCategories();
            renderMenu();
        } catch (error) {
            console.error("Fetch error:", error);
            // Try to load from standardized inventory cache
            const cachedProds = localStorage.getItem('shayorsInventory');
            const cachedCats = localStorage.getItem('shayorsCategories');
            
            if (cachedProds) productData = JSON.parse(cachedProds);
            if (cachedCats) categories = JSON.parse(cachedCats);

            if (productData && productData.length > 0) {
                renderCategories();
                renderMenu();
            } else {
                menuContainer.innerHTML = '<div class="loader">Unable to load menu. Please connect to the internet once to sync data.</div>';
            }
        }
    };

    function renderCategories() {
        // If we have categories from API/Cache, use them, otherwise derive from products
        let catList = [];
        if (categories && categories.length > 0) {
            catList = ['All', ...categories.map(c => c.name)];
        } else {
            catList = ['All', ...new Set(productData.map(p => p.category))].filter(Boolean);
        }

        menuCategories.innerHTML = catList.map(cat => `
            <button class="cat-btn ${cat === currentCategory ? 'active' : ''}" onclick="filterMenu('${cat}')">
                ${cat}
            </button>
        `).join('');
    }

    window.filterMenu = (category) => {
        currentCategory = category;
        renderCategories();
        renderMenu();
    };

    function renderMenu() {
        const filtered = currentCategory === 'All' 
            ? productData 
            : productData.filter(p => p.category === currentCategory);

        if (filtered.length === 0) {
            menuContainer.innerHTML = '<p class="loader">No products found in this category.</p>';
            return;
        }

        // Group by sub-category if needed, or just list
        menuContainer.innerHTML = `
            <h2 class="menu-section-title">${currentCategory}</h2>
            <div class="menu-list">
                ${filtered.map(product => `
                    <div class="menu-item" onclick="showDetails('${product._id}')">
                        <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}" class="menu-item-img">
                        <div class="menu-item-info">
                            <div class="menu-item-header">
                                <h3>${product.name}</h3>
                                <span class="menu-item-price">₦${parseFloat(product.price).toLocaleString()}</span>
                            </div>
                            <p class="menu-item-desc">${product.description || product.review || `${product.brand || ''} ${product.size || ''} ${product.shade && product.shade !== 'N/A' ? product.shade : ''}` || 'Premium quality product.'}</p>
                            <div class="menu-item-meta">
                                <span>${product.category}</span>
                                ${product.rating ? `<span style="margin-left: 10px;">★ ${product.rating.toFixed(1)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    window.showDetails = (id) => {
        const product = productData.find(p => p._id === id);
        if (!product) return;

        const reviewsHtml = (product.reviews && product.reviews.length > 0)
            ? product.reviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <strong>${r.name}</strong>
                        <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <p style="font-size: 0.8rem; color: #555;">${r.comment}</p>
                </div>
            `).join('')
            : '<p style="color: #999; font-size: 0.8rem;">No reviews yet.</p>';

        modalBody.innerHTML = `
            <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}" class="modal-img">
            <h2 class="modal-title">${product.name}</h2>
            <p class="modal-price">₦${parseFloat(product.price).toLocaleString()}</p>
            
            <div class="modal-section">
                <h4>Description</h4>
                <p>${product.description || product.review || 'Premium quality product from Shayors Cosmetics.'}</p>
            </div>

            ${(product.brand || product.size || (product.shade && product.shade !== 'N/A')) ? `
            <div class="modal-section">
                <h4>Specifications</h4>
                <p>
                    ${product.brand ? `<strong>Brand:</strong> ${product.brand}<br>` : ''}
                    ${product.size ? `<strong>Size:</strong> ${product.size}<br>` : ''}
                    ${(product.shade && product.shade !== 'N/A') ? `<strong>Shade:</strong> ${product.shade}<br>` : ''}
                    ${product.skinTypes ? `<strong>Skin Types:</strong> ${product.skinTypes}<br>` : ''}
                </p>
            </div>` : ''}

            ${product.howToUse ? `
            <div class="modal-section">
                <h4>How to Use</h4>
                <p>${product.howToUse}</p>
            </div>` : ''}

            <div class="modal-section">
                <h4>Customer Reviews</h4>
                <div class="reviews-list">
                    ${reviewsHtml}
                </div>
            </div>
        `;

        infoModal.classList.remove('hidden');
    };

    closeModalBtn.onclick = () => {
        infoModal.classList.add('hidden');
    };

    window.onclick = (event) => {
        if (event.target == infoModal) {
            infoModal.classList.add('hidden');
        }
    };

    // Scroll Buttons & Drag-to-Scroll Logic
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');

    if (scrollLeftBtn && scrollRightBtn && menuCategories) {
        scrollLeftBtn.onclick = () => {
            menuCategories.scrollBy({ left: -200, behavior: 'smooth' });
        };
        scrollRightBtn.onclick = () => {
            menuCategories.scrollBy({ left: 200, behavior: 'smooth' });
        };

        // Drag to Scroll functionality for Mouse users
        let isDown = false;
        let startX;
        let scrollLeft;

        menuCategories.addEventListener('mousedown', (e) => {
            isDown = true;
            menuCategories.classList.add('active');
            startX = e.pageX - menuCategories.offsetLeft;
            scrollLeft = menuCategories.scrollLeft;
        });
        menuCategories.addEventListener('mouseleave', () => {
            isDown = false;
        });
        menuCategories.addEventListener('mouseup', () => {
            isDown = false;
        });
        menuCategories.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - menuCategories.offsetLeft;
            const walk = (x - startX) * 2; //scroll-fast
            menuCategories.scrollLeft = scrollLeft - walk;
        });
    }

    fetchData();
});
