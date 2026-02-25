document.addEventListener('DOMContentLoaded', () => {
    // Clear old cached data to load new images
    localStorage.removeItem('shayorsInventory');
    
    // 1. Data Storage for Products with Categories (Unified with Inventory)
    const defaultProducts = [
        { id: 1, category: "Skincare", name: "Cerave Hydrating Cleanser", brand: "Cerave", price: 18.00, stock: 24, image: "Image/WhatsApp Image 2026-02-20 at 9.52.34 AM.jpeg" },
        { id: 2, category: "Bath & Body", name: "Halfacast Skin Glow Oil", brand: "Halfacast", price: 35.00, stock: 12, image: "Image/WhatsApp Image 2026-02-20 at 9.52.33 AM.jpeg" },
        { id: 3, category: "Skincare", name: "Cosrx Snail Mucin Essence", brand: "Cosrx", price: 22.00, stock: 3, image: "Image/WhatsApp Image 2026-02-20 at 9.52.33 AM (1).jpeg" },
        { id: 4, category: "Facecream", name: "Olay Regenerist Cream", brand: "Olay", price: 45.00, stock: 0, image: "Image/WhatsApp Image 2026-02-20 at 9.52.32 AM.jpeg" },
        { id: 5, category: "Bath & Body", name: "Halfacast Black Soap", brand: "Halfacast", price: 15.00, stock: 50, image: "Image/WhatsApp Image 2026-02-20 at 9.52.32 AM (1).jpeg" },
        { id: 6, category: "Spa", name: "Luxury Spa Mist", brand: "Spa", price: 28.00, stock: 10, image: "Image/WhatsApp Image 2026-02-20 at 9.52.31 AM.jpeg" },
        { id: 7, category: "Perfume", name: "Midnight Bloom", brand: "Fragrance", price: 60.00, stock: 15, image: "Image/WhatsApp Image 2026-02-20 at 9.52.30 AM.jpeg" },
        { id: 8, category: "Supplements", name: "Glow Vitamins", brand: "Supplements", price: 30.00, stock: 30, image: "Image/WhatsApp Image 2026-02-20 at 9.52.29 AM.jpeg" },
        { id: 9, category: "Sunscreen", name: "Ultra UV Shield", brand: "Sunscreen", price: 25.00, stock: 20, image: "Image/WhatsApp Image 2026-02-20 at 9.52.39 AM.jpeg" },
        { id: 10, category: "Humidifiers", name: "Zen Mist Humidifier", brand: "Humidifiers", price: 40.00, stock: 8, image: "Image/WhatsApp Image 2026-02-20 at 9.52.39 AM (1).jpeg" },
        { id: 11, category: "Diffusers", name: "Aroma Diffuser", brand: "Diffusers", price: 35.00, stock: 5, image: "Image/WhatsApp Image 2026-02-20 at 9.52.38 AM.jpeg" },
        { id: 12, category: "Skincare", name: "Cerave Moisturizing Lotion", brand: "Cerave", price: 20.00, stock: 15, image: "Image/WhatsApp Image 2026-02-20 at 9.52.38 AM (1).jpeg" },
        { id: 13, category: "Fragrance", name: "Velvet Oud", brand: "Fragrance", price: 85.00, stock: 4, image: "Image/WhatsApp Image 2026-02-20 at 9.52.37 AM.jpeg" },
        { id: 14, category: "Bath & Body", name: "Halfacast Brightening Soap", brand: "Halfacast", price: 12.00, stock: 25, image: "Image/WhatsApp Image 2026-02-20 at 9.52.37 AM (1).jpeg" },
        { id: 15, category: "Spa", name: "Himalayan Salt Scrub", brand: "Spa", price: 24.00, stock: 18, image: "Image/WhatsApp Image 2026-02-20 at 9.52.41 AM (2).jpeg" },
        { id: 16, category: "Skincare", name: "Cosrx BHA Blackhead Power Liquid", brand: "Cosrx", price: 26.00, stock: 10, image: "Image/WhatsApp Image 2026-02-20 at 9.52.41 AM (1).jpeg" },
        { id: 17, category: "Facecream", name: "Olay Luminous Brightening Cream", brand: "Olay", price: 38.00, stock: 14, image: "Image/WhatsApp Image 2026-02-20 at 9.52.40 AM.jpeg" },
        { id: 18, category: "Bath & Body", name: "Halfacast Vitamin C Body Wash", brand: "Halfacast", price: 22.00, stock: 20, image: "Image/WhatsApp Image 2026-02-20 at 9.52.41 AM.jpeg" },
        { id: 19, category: "Supplements", name: "Collagen Boost Powder", brand: "Supplements", price: 45.00, stock: 12, image: "Image/WhatsApp Image 2026-02-20 at 9.52.42 AM (1).jpeg" },
        { id: 20, category: "Sunscreen", name: "Cerave Sunscreen Stick SPF 50", brand: "Cerave", price: 16.00, stock: 40, image: "Image/WhatsApp Image 2026-02-20 at 9.52.46 AM.jpeg" },
        { id: 21, category: "Skincare", name: "Face Serum", brand: "Cosrx", price: 28.00, stock: 15, image: "Image/WhatsApp Image 2026-02-20 at 9.52.43 AM.jpeg" },
        { id: 22, category: "Perfume", name: "Golden Aura", brand: "Fragrance", price: 75.00, stock: 8, image: "Image/WhatsApp Image 2026-02-20 at 9.52.44 AM.jpeg" },
        { id: 23, category: "Spa", name: "Detox Body Wrap", brand: "Spa", price: 55.00, stock: 5, image: "Image/WhatsApp Image 2026-02-20 at 9.52.45 AM.jpeg" },
        { id: 24, category: "Bath & Body", name: "Creamy Shea Butter", brand: "Shayors", price: 12.00, stock: 22, image: "Image/WhatsApp Image 2026-02-20 at 9.52.46 AM (1).jpeg" },
        { id: 25, category: "Facecream", name: "Night Repair Cream", brand: "Olay", price: 42.00, stock: 10, image: "Image/WhatsApp Image 2026-02-20 at 9.52.47 AM.jpeg" },
        { id: 26, category: "Humidifiers", name: "Cool Mist Pro", brand: "Humidifiers", price: 65.00, stock: 3, image: "Image/WhatsApp Image 2026-02-20 at 9.52.48 AM.jpeg" },
        { id: 27, category: "Diffusers", name: "Essential Oil Set", brand: "Diffusers", price: 30.00, stock: 18, image: "Image/WhatsApp Image 2026-02-20 at 9.52.49 AM.jpeg" },
        { id: 28, category: "Supplements", name: "Beauty Sleep Melatonin", brand: "Supplements", price: 25.00, stock: 25, image: "Image/WhatsApp Image 2026-02-20 at 9.52.50 AM.jpeg" },
        { id: 29, category: "Sunscreen", name: "Sport Shield SPF 70", brand: "Sunscreen", price: 20.00, stock: 14, image: "Image/WhatsApp Image 2026-02-20 at 9.52.51 AM.jpeg" },
        { id: 30, category: "Skincare", name: "Hydrating Toner", brand: "Cerave", price: 15.00, stock: 30, image: "Image/WhatsApp Image 2026-02-20 at 9.52.52 AM.jpeg" },
    ];

    // Read from unified storage or fallback
    let productData = JSON.parse(localStorage.getItem('shayorsInventory')) || defaultProducts;

    const categories = ["Bath & Body", "Spa", "Skincare", "Perfume", "Supplements", "Sunscreen", "Facecream", "Fragrance", "Humidifiers", "Diffusers"];

    // 2. Render Categories and Search in Nav
    const searchNav = document.getElementById('searchNav');
    if (searchNav) {
        searchNav.innerHTML = `
            <div class="search-container">
                <select id="catSelect" class="selective-bar">
                    <option value="All">All Categories</option>
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <input type="text" placeholder="Search product..." id="navSearch">
            </div>
        `;
    }

    // 3. Render Product Rows (Default View)
    const productRowsContainer = document.getElementById('productRowsContainer');

    function createProductCard(product) {
        const available = product.stock > 0;
        return `
            <div class="product-card">
                <span class="product-status ${available ? 'status-available' : 'status-unavailable'}">
                    ${available ? 'In Stock' : 'Out of Stock'}
                </span>
                <img src="${product.image}" alt="${product.name}">
                <div class="card-content">
                    <p class="brand">${product.brand}</p>
                    <h3>${product.name}</h3>
                    <p class="price">₦${parseFloat(product.price).toLocaleString()}</p>
                    <p class="qty">Qty Available: ${product.stock}</p>
                    <button class="btn primary" ${available ? '' : 'disabled'}>
                        ${available ? 'Order Now' : 'Join Waitlist'}
                    </button>
                </div>
            </div>
        `;
    }

    function renderProductRows(filterCat = "All", searchTerm = "") {
        if (!productRowsContainer) return;

        let filteredProducts = productData;

        // Filter by Category
        if (filterCat !== "All") {
            filteredProducts = filteredProducts.filter(p => p.category === filterCat);
        }

        // Filter by Search Term
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.brand.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // If filtering/searching is active, show grid
        if (filterCat !== "All" || searchTerm !== "") {
            productRowsContainer.innerHTML = `
                <div class="search-results">
                    <h2 class="row-title">${filterCat === 'All' ? 'Search' : filterCat} Results (${filteredProducts.length})</h2>
                    <div class="product-grid">
                        ${filteredProducts.length > 0 ? 
                            filteredProducts.map(p => createProductCard(p)).join('') : 
                            '<p class="no-results">No products found matching your search.</p>'}
                    </div>
                </div>
            `;
        } else {
            // Default: Show Horizontal Rows (Sliders) for all categories with products
            const rowsToShow = categories;
            
            productRowsContainer.innerHTML = rowsToShow.map((cat, index) => {
                const productsInCat = productData.filter(p => p.category === cat);
                if (productsInCat.length === 0) return '';

                return `
                    <div class="row-container animate-on-scroll">
                        <h2 class="row-title">${cat}</h2>
                        <div class="slider-wrapper">
                            <div class="product-slider" id="slider-${index}">
                                ${productsInCat.map(p => createProductCard(p)).join('')}
                            </div>
                            <button class="slider-btn prev" data-slider="slider-${index}">&#10094;</button>
                            <button class="slider-btn next" data-slider="slider-${index}">&#10095;</button>
                        </div>
                    </div>
                `;
            }).join('');
            setupSliders();
        }
        
        // Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    function setupSliders() {
        const sliders = document.querySelectorAll('.product-slider');
        sliders.forEach(slider => {
            const id = slider.id;
            const prev = document.querySelector(`.slider-btn.prev[data-slider="${id}"]`);
            const next = document.querySelector(`.slider-btn.next[data-slider="${id}"]`);
            let counter = 0;
            const cardWidth = 330;

            if (next && prev) {
                next.addEventListener('click', () => {
                    const visibleCards = Math.floor(slider.parentElement.clientWidth / cardWidth);
                    const totalCards = slider.children.length;
                    if (counter < totalCards - visibleCards) {
                        counter++;
                        slider.style.transform = `translateX(${-counter * cardWidth}px)`;
                    }
                });

                prev.addEventListener('click', () => {
                    if (counter > 0) {
                        counter--;
                        slider.style.transform = `translateX(${-counter * cardWidth}px)`;
                    }
                });
            }
        });
    }

    // 4. Event Listeners for Filtering
    if (searchNav) {
        const catSelect = document.getElementById('catSelect');
        const navSearch = document.getElementById('navSearch');

        catSelect.addEventListener('change', () => {
            renderProductRows(catSelect.value, navSearch.value);
        });

        navSearch.addEventListener('input', () => {
            renderProductRows(catSelect.value, navSearch.value);
        });
    }

    // Initial Render
    renderProductRows();
});
