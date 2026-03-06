document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Storage for Products (Unified with Inventory)
    // We NO LONGER clear localStorage here.
    
    const initialProducts = [
        { id: 1, category: "Skincare", name: "Cerave Hydrating Cleanser", brand: "Cerave", shade: "N/A", size: "236ml", ingredients: "Ceramides, Hyaluronic Acid", costPrice: 12.00, price: 18.00, stock: 24, threshold: 5, image: "../Image/WhatsApp1.jpeg" },
        { id: 2, category: "Bath & Body", name: "Halfacast Skin Glow Oil", brand: "Halfacast", shade: "N/A", size: "200ml", ingredients: "Natural Oils, Vitamin E", costPrice: 25.00, price: 35.00, stock: 12, threshold: 5, image: "../Image/WhatsApp2.jpeg" },
        { id: 3, category: "Skincare", name: "Cosrx Snail Mucin Essence", brand: "Cosrx", shade: "N/A", size: "100ml", ingredients: "96% Snail Mucin", costPrice: 15.00, price: 22.00, stock: 3, threshold: 5, image: "../Image/WhatsApp3.jpeg" },
        { id: 4, category: "Facecream", name: "Olay Regenerist Cream", brand: "Olay", shade: "N/A", size: "50g", ingredients: "Niacinamide, Peptides", costPrice: 30.00, price: 45.00, stock: 0, threshold: 5, image: "../Image/WhatsApp4.jpeg" },
        { id: 5, category: "Bath & Body", name: "Halfacast Black Soap", brand: "Halfacast", shade: "N/A", size: "500g", ingredients: "African Black Soap, Honey", costPrice: 10.00, price: 15.00, stock: 50, threshold: 5, image: "../Image/WhatsApp5.jpeg" },
        { id: 6, category: "Spa", name: "Luxury Spa Mist", brand: "Spa", shade: "N/A", size: "150ml", ingredients: "Essential Oils, Eucalyptus", costPrice: 18.00, price: 28.00, stock: 10, threshold: 5, image:"../Image/WhatsApp6.jpeg" },
        { id: 7, category: "Perfume", name: "Midnight Bloom", brand: "Fragrance", shade: "N/A", size: "100ml", ingredients: "Floral notes, Musk", costPrice: 40.00, price: 60.00, stock: 15, threshold: 5, image: "../Image/WhatsApp7.jpeg" },
        { id: 8, category: "Supplements", name: "Glow Vitamins", brand: "Supplements", shade: "N/A", size: "60 caps", ingredients: "Biotin, Vitamin C", costPrice: 20.00, price: 30.00, stock: 30, threshold: 5, image: "../Image/WhatsApp8.jpeg" },
        { id: 9, category: "Sunscreen", name: "Ultra UV Shield", brand: "Sunscreen", shade: "N/A", size: "50ml", ingredients: "Zinc Oxide, SPF 50", costPrice: 15.00, price: 25.00, stock: 20, threshold: 5, image: "../Image/WhatsApp9.jpeg" },
        { id: 10, category: "Humidifiers", name: "Zen Mist Humidifier", brand: "Humidifiers", shade: "N/A", size: "Large", ingredients: "N/A", costPrice: 28.00, price: 40.00, stock: 8, threshold: 2, image: "../Image/WhatsApp10.jpeg" }
    ];

    // Read from unified storage or fallback
    let productData = JSON.parse(localStorage.getItem('shayorsInventory')) || initialProducts;

    const categories = ["Skincare", "Bath & Body", "Facecream", "Spa", "Perfume", "Supplements", "Sunscreen", "Humidifiers", "Diffusers", "Raw Materials"];

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
