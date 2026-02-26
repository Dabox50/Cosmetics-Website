document.addEventListener('DOMContentLoaded', () => {
    // Clear old cached data to load new images
    localStorage.removeItem('shayorsInventory');
    
    // 1. Data Storage for Products with Categories (Unified with Inventory)
    const defaultProducts = [
        { id: 1, category: "Skincare", name: "Cerave Hydrating Cleanser", brand: "Cerave", price: 18.00, stock: 24, image: "../Image/WhatsApp2.jpeg"},
        { id: 2, category: "Bath & Body", name: "Halfacast Skin Glow Oil", brand: "Halfacast", price: 35.00, stock: 12, image: "../Image/WhatsApp2.jpeg" },
        { id: 3, category: "Skincare", name: "Cosrx Snail Mucin Essence", brand: "Cosrx", price: 22.00, stock: 3, image: "../Image/WhatsApp3.jpeg" },
        { id: 4, category: "Facecream", name: "Olay Regenerist Cream", brand: "Olay", price: 45.00, stock: 0, image: "../Image/WhatsApp4.jpeg" },
        { id: 5, category: "Bath & Body", name: "Halfacast Black Soap", brand: "Halfacast", price: 15.00, stock: 50, image: "../Image/WhatsApp5.jpeg" },
        { id: 6, category: "Spa", name: "Luxury Spa Mist", brand: "Spa", price: 28.00, stock: 10, image: "../Image/WhatsApp6.jpeg" },
        { id: 7, category: "Perfume", name: "Midnight Bloom", brand: "Fragrance", price: 60.00, stock: 15, image: "../Image/WhatsApp7.jpeg" },
        { id: 8, category: "Supplements", name: "Glow Vitamins", brand: "Supplements", price: 30.00, stock: 30, image: "../Image/WhatsApp8.jpeg" },
        { id: 9, category: "Sunscreen", name: "Ultra UV Shield", brand: "Sunscreen", price: 25.00, stock: 20, image: "../Image/WhatsApp9.jpeg" },
        { id: 10, category: "Humidifiers", name: "Zen Mist Humidifier", brand: "Humidifiers", price: 40.00, stock: 8, image: "../Image/WhatsApp10.jpeg" },
        { id: 11, category: "Diffusers", name: "Aroma Diffuser", brand: "Diffusers", price: 35.00, stock: 5, image: "../Image/WhatsApp11.jpeg" },
        { id: 12, category: "Skincare", name: "Cerave Moisturizing Lotion", brand: "Cerave", price: 20.00, stock: 15, image: "../Image/WhatsApp12.jpeg" },
        { id: 13, category: "Fragrance", name: "Velvet Oud", brand: "Fragrance", price: 85.00, stock: 4, image: "../Image/WhatsApp15.jpeg" },
        { id: 14, category: "Bath & Body", name: "Halfacast Brightening Soap", brand: "Halfacast", price: 12.00, stock: 15, image: "../Image/WhatsApp14.jpeg" },
        { id: 15, category: "Spa", name: "Himalayan Salt Scrub", brand: "Spa", price: 48.00, stock: 18, image: "../Image/WhatsApp15.jpeg" },
        { id: 16, category: "Skincare", name: "Cosrx BHA Blackhead Power Liquid", brand: "Cosrx", price: 44.00, stock: 17, image: "../Image/WhatsApp16.jpeg" },
        { id: 17, category: "Facecream", name: "Olay Luminous Brightening Cream", brand: "Olay", price: 38.00, stock: 14, image: "../Image/WhatsApp17.jpeg" },
        { id: 18, category: "Bath & Body", name: "Halfacast Vitamin C Body Wash", brand: "Halfacast", price: 22.00, stock: 20, image: "../Image/WhatsApp18.jpeg" },
        { id: 19, category: "Supplements", name: "Collagen Boost Powder", brand: "Supplements", price: 45.00, stock: 12, image: "../Image/WhatsApp19.jpeg" },
        { id: 20, category: "Sunscreen", name: "Cerave Sunscreen Stick SPF 50", brand: "Cerave", price: 16.00, stock: 40, image: "../Image/WhatsApp20.jpeg" },
        { id: 21, category: "Skincare", name: "Face Serum", brand: "Cosrx", price: 28.00, stock: 15, image: "../Image/WhatsApp21.jpeg" },
        { id: 22, category: "Perfume", name: "Golden Aura", brand: "Fragrance", price: 75.00, stock: 8, image: "../Image/WhatsApp22.jpeg" },
        { id: 23, category: "Spa", name: "Detox Body Wrap", brand: "Spa", price: 55.00, stock: 5, image: "../Image/WhatsApp23.jpeg" },
        { id: 24, category: "Bath & Body", name: "Creamy Shea Butter", brand: "Shayors", price: 18.00, stock: 17, image: "../Image/WhatsApp24.jpeg" },
        { id: 25, category: "Facecream", name: "Night Repair Cream", brand: "Olay", price: 48.00, stock: 17, image: "../Image/WhatsApp25.jpeg" },
        { id: 26, category: "Humidifiers", name: "Cool Mist Pro Humidifier", brand: "Humidifiers", price: 78.00, stock: 3, image: "../Image/WhatsApp26.jpeg" },
        { id: 27, category: "Diffusers", name: "Essential Oil Set", brand: "Diffusers", price: 30.00, stock: 18, image: "../Image/WhatsApp27.jpeg" },
        { id: 28, category: "Supplements", name: "Beauty Sleep Melatonin", brand: "Supplements", price: 25.00, stock: 25, image: "../Image/WhatsApp28.jpeg" },
        { id: 29, category: "Sunscreen", name: "Sport Shield SPF 70", brand: "Sunscreen", price: 20.00, stock: 14, image: "../Image/WhatsApp29.jpeg" },
        { id: 30, category: "Skincare", name: "Hydrating Toner", brand: "Cerave", price: 15.00, stock: 30, image: "../Image/WhatsApp30.jpeg" },
        { id: 31, category: "Bath & Body", name: "Shayors Body Glow", brand: "Shayors", price: 25.00, stock: 15, image: "../Image/WhatsApp31.jpeg" },
        { id: 32, category: "Spa", name: "Relaxing Lavender Mist", brand: "Spa", price: 22.00, stock: 10, image: "../Image/WhatsApp32.jpeg" },
        { id: 33, category: "Skincare", name: "Cosrx Advanced Snail Cream", brand: "Cosrx", price: 28.00, stock: 12, image: "../Image/WhatsApp33.jpeg" },
        { id: 34, category: "Perfume", name: "Rose Seduction", brand: "Fragrance", price: 65.00, stock: 7, image: "../Image/WhatsApp34.jpeg" },
        { id: 35, category: "Supplements", name: "Vitamin E Softgels", brand: "Supplements", price: 18.00, stock: 40, image: "../Image/WhatsApp35.jpeg" },
        { id: 36, category: "Sunscreen", name: "Sun Protection Mist", brand: "Sunscreen", price: 24.00, stock: 25, image: "../Image/WhatsApp36.jpeg" },
        { id: 37, category: "Facecream", name: "Anti-Aging Night Cream", brand: "Olay", price: 50.00, stock: 9, image: "../Image/WhatsApp37.jpeg" },
        { id: 38, category: "Fragrance", name: "Ocean Breeze", brand: "Fragrance", price: 45.00, stock: 14, image: "../Image/WhatsApp38.jpeg" },
        { id: 39, category: "Humidifiers", name: "Ultrasonic Humidifier", brand: "Humidifiers", price: 55.00, stock: 6, image: "../Image/WhatsApp39.jpeg" },
        { id: 40, category: "Diffusers", name: "Wood Grain Diffuser", brand: "Diffusers", price: 42.00, stock: 8, image: "../Image/WhatsApp40.jpeg" },
        { id: 41, category: "Skincare", name: "Cerave Renewing SA Cleanser", brand: "Cerave", price: 22.00, stock: 18, image: "../Image/WhatsApp41.jpeg" },
        { id: 42, category: "Bath & Body", name: "Halfacast Cocoa Butter", brand: "Halfacast", price: 20.00, stock: 22, image: "../Image/WhatsApp42.jpeg" },
        { id: 43, category: "Spa", name: "Dead Sea Mud Mask", brand: "Spa", price: 35.00, stock: 15, image: "../Image/WhatsApp43.jpeg" },
        { id: 44, category: "Perfume", name: "Summer Bloom", brand: "Fragrance", price: 58.00, stock: 10, image: "../Image/WhatsApp44.jpeg" },
        { id: 45, category: "Supplements", name: "Omega-3 Fish Oil", brand: "Supplements", price: 32.00, stock: 20, image: "../Image/WhatsApp45.jpeg" },
        { id: 46, category: "Sunscreen", name: "Matte Finish SPF 50", brand: "Sunscreen", price: 28.00, stock: 12, image: "../Image/WhatsApp46.jpeg" },
        { id: 47, category: "Facecream", name: "Moisturizing Day Cream", brand: "Olay", price: 35.00, stock: 16, image: "../Image/WhatsApp47.jpeg" },
        { id: 48, category: "Fragrance", name: "Deep Wood Oud", brand: "Fragrance", price: 90.00, stock: 5, image: "../Image/WhatsApp48.jpeg" },
        { id: 49, category: "Humidifiers", name: "Smart Air Humidifier", brand: "Humidifiers", price: 70.00, stock: 4, image: "../Image/WhatsApp49.jpeg" },
        { id: 50, category: "Diffusers", name: "Electric Aroma Lamp", brand: "Diffusers", price: 38.00, stock: 9, image: "../Image/WhatsApp50.jpeg" },
        { id: 51, category: "Skincare", name: "Cosrx BHA/AHA Toner", brand: "Cosrx", price: 24.00, stock: 20, image: "../Image/WhatsApp51.jpeg" },
        { id: 52, category: "Bath & Body", name: "Shayors Herbal Soap", brand: "Shayors", price: 15.00, stock: 30, image: "../Image/WhatsApp52.jpeg" },
        { id: 53, category: "Spa", name: "Eucalyptus Bath Salts", brand: "Spa", price: 18.00, stock: 25, image: "../Image/WhatsApp53.jpeg" },
        { id: 54, category: "Perfume", name: "Golden Dust", brand: "Fragrance", price: 80.00, stock: 6, image: "../Image/WhatsApp54.jpeg" },
        { id: 55, category: "Supplements", name: "Zinc & Vitamin C", brand: "Supplements", price: 22.00, stock: 35, image: "../Image/WhatsApp55.jpeg" },
        { id: 56, category: "Sunscreen", name: "Invisible Shield SPF 40", brand: "Sunscreen", price: 30.00, stock: 15, image: "../Image/WhatsApp56.jpeg" },
        { id: 57, category: "Facecream", name: "Pore Minimizing Cream", brand: "Olay", price: 40.00, stock: 12, image: "../Image/WhatsApp57.jpeg" },
        { id: 58, category: "Fragrance", name: "Floral Fantasy", brand: "Fragrance", price: 55.00, stock: 8, image: "../Image/WhatsApp58.jpeg" },
        { id: 59, category: "Skincare", name: "Cerave Eye Repair Cream", brand: "Cerave", price: 18.00, stock: 15, image: "../Image/WhatsApp59.jpeg" }
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
