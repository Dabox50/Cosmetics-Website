document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Storage for Products (Dynamic from API)
    let productData = [];
    let spaServices = []; // Will be fetched from API
    const initialSpaCategories = [{ name: "Salon & Beauty" }, { name: "Spa and Wellness" }, { name: "Massage" }];
    let spaCategories = JSON.parse(localStorage.getItem('shayorsSpaCategories')) || initialSpaCategories;
    const initialCategoriesList = ["Scrub", "Black soap", "Lotion", "Tube", "Oil", "Serum", "Bar soap", "Cleanser", "Toner", "Perfume oil", "Airfreshner", "Gift box", "Tea", "Facesoap", "Body spray", "Roll on", "Lubricant", "Sponge", "Haircare", "Aphrodisiacs", "Cotton pad", "Wipes"];
    let categories = JSON.parse(localStorage.getItem('shayorsCategories')) || initialCategoriesList.map(name => ({ name }));

    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');

    const API_BASE = isLocal 
        ? `http://${window.location.hostname}:5000/api` 
        : "https://cosmetics-website.fly.dev/api";

    // 4. Render Product Rows (Default View)
    const productRowsContainer = document.getElementById('productRowsContainer');

    // Helper to get token safely
    function getAdminToken() {
        const token = sessionStorage.getItem('shayorsAdminToken') || localStorage.getItem('shayorsAdminToken');
        if (!token || token === "undefined" || token === "null" || token.length < 20) {
            return null;
        }
        return token;
    }

    // 2. Fetch Data from API (Appends or replaces static data)
    const fetchProducts = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            // Parallel fetching with timeout
            const [catRes, prodRes, servRes, spaCatRes] = await Promise.allSettled([
                fetch(`${API_BASE}/categories`, { signal: controller.signal }),
                fetch(`${API_BASE}/products`, { signal: controller.signal }),
                fetch(`${API_BASE}/services`, { signal: controller.signal }),
                fetch(`${API_BASE}/spa-categories`, { signal: controller.signal }).catch(() => ({ status: 'rejected' }))
            ]);

            clearTimeout(timeoutId);

            if (catRes.status === 'fulfilled' && catRes.value.ok) {
                const data = await catRes.value.json();
                if (Array.isArray(data) && data.length > 0) {
                    categories = data;
                    localStorage.setItem('shayorsCategories', JSON.stringify(categories));
                }
            }
            
            if (spaCatRes.status === 'fulfilled' && spaCatRes.value && spaCatRes.value.ok) {
                const data = await spaCatRes.value.json();
                if (Array.isArray(data) && data.length > 0) {
                    spaCategories = data;
                    localStorage.setItem('shayorsSpaCategories', JSON.stringify(spaCategories));
                }
            }

            if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
                const apiData = await prodRes.value.json();
                if (apiData && apiData.length > 0) {
                    productData = apiData; 
                }
            }

            if (servRes.status === 'fulfilled' && servRes.value.ok) {
                spaServices = await servRes.value.json();
            }

            // Check for URL parameters from homepage search
            const urlParams = new URLSearchParams(window.location.search);
            const searchParam = urlParams.get('search');
            const catParam = urlParams.get('cat');

            if (searchNav) {
                if (searchParam) document.getElementById('navSearch').value = searchParam;
                if (catParam) {
                    // We'll update the select value after it's populated in renderProductRows
                    setTimeout(() => {
                        const catSelect = document.getElementById('catSelect');
                        if (catSelect) {
                            catSelect.value = catParam;
                            renderProductRows(catParam, searchParam || "");
                        }
                    }, 100);
                } else {
                    renderProductRows("All", searchParam || "");
                }
            } else {
                renderProductRows();
            }
        } catch (error) {
            console.error('API Error or Timeout:', error);
            renderProductRows(); // Fallback
        }
    };

    fetchProducts();

    // 4. Render Search UI (Categories will be added dynamically after fetch)
    const searchNav = document.getElementById('searchNav');
    if (searchNav) {
        searchNav.innerHTML = `
            <div class="search-container">
                <select id="catSelect" class="selective-bar">
                    <option value="All">All Categories</option>
                </select>
                <input type="text" placeholder="Search product..." id="navSearch">
            </div>
        `;
    }

    function createProductCard(product) {
        const available = product.stock > 0;
        return `
            <div class="product-card">
                <span class="product-status ${available ? 'status-available' : 'status-unavailable'}">
                    ${available ? 'In Stock' : 'Out of Stock'}
                </span>
                <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}">
                <div class="card-content">
                    <p class="brand">${product.category || 'Product'} | ${product.brand || 'Shayors'}</p>
                    <h3>${product.name}</h3>
                    <p class="price">₦${parseFloat(product.price).toLocaleString()}</p>
                    
                    <div class="product-details-mini">
                        ${product.skinTypes ? `<p><strong>Skin Type:</strong> ${product.skinTypes}</p>` : ''}
                        ${product.skinConcern ? `<p><strong>Concern:</strong> ${product.skinConcern}</p>` : ''}
                    </div>

                    <div class="card-actions">
                        <button class="btn primary" ${available ? '' : 'disabled'} onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                            ${available ? 'Add to Cart 🛒' : 'Out of Stock'}
                        </button>
                        <button class="btn secondary info-btn" onclick="showProductInfo('${product._id}')">Details</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.showProductInfo = async function(id) {
        let product = productData.find(p => p._id === id);
        if (!product) return;

        // Try to fetch fresh product data to get latest reviews
        try {
            const res = await fetch(`${API_BASE}/products/${id}`);
            if (res.ok) {
                product = await res.json();
                // Update local data
                const idx = productData.findIndex(p => p._id === id);
                if (idx !== -1) productData[idx] = product;
            }
        } catch (error) {
            console.error("Failed to fetch fresh product details:", error);
        }

        const reviewsHtml = (product.reviews && product.reviews.length > 0) 
            ? product.reviews.map(r => `
                <div class="review-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${r.name}</strong>
                        <span style="color: var(--primary-color);">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #555; margin-top: 5px;">${r.comment}</p>
                    <small style="color: #999;">${new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
            `).join('')
            : '<p style="color: #999; font-size: 0.9rem;">No reviews yet. Be the first to review!</p>';

        const infoHtml = `
            <div class="product-info-modal">
                <div class="info-grid">
                    <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}">
                    <div class="info-text">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h2>${product.name}</h2>
                                <p class="info-brand">By ${product.brand || 'Shayors'}</p>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: var(--primary-color); font-size: 1.2rem;">
                                    ${product.rating ? '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5-Math.round(product.rating)) : ''}
                                </div>
                                <small style="color: #888;">${product.numReviews || 0} reviews</small>
                            </div>
                        </div>
                        <p class="info-price">₦${parseFloat(product.price).toLocaleString()}</p>
                        <hr>
                        ${product.description ? `<div class="info-section"><h4>Description</h4><p>${product.description}</p></div>` : ''}
                        ${product.skinTypes ? `<div class="info-section"><h4>Skin Types</h4><p>${product.skinTypes}</p></div>` : ''}
                        ${product.skinConcern ? `<div class="info-section"><h4>Skin Concern</h4><p>${product.skinConcern}</p></div>` : ''}
                        ${product.howToUse ? `<div class="info-section"><h4>How to Use</h4><p>${product.howToUse}</p></div>` : ''}
                        ${product.ingredients ? `<div class="info-section"><h4>Ingredients</h4><p>${product.ingredients}</p></div>` : ''}
                        
                        <div class="reviews-section" style="margin-top: 30px;">
                            <h3 style="margin-bottom: 15px; border-bottom: 2px solid var(--primary-color); display: inline-block;">Customer Reviews</h3>
                            <div class="reviews-list" style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;">
                                ${reviewsHtml}
                            </div>
                            
                            <div class="add-review-box" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                                <h4 style="margin-bottom: 10px;">Leave a Review</h4>
                                <form id="reviewForm" onsubmit="event.preventDefault(); submitReview('${product._id}')">
                                    <input type="text" id="revName" placeholder="Your Name" required style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                    <div style="margin-bottom: 15px;">
                                        <label style="font-size: 0.85rem; color: #555; display: block; margin-bottom: 5px;">Your Rating:</label>
                                        <div class="star-rating">
                                            <input type="radio" id="star5" name="rating" value="5" required /><label for="star5" title="5 stars"></label>
                                            <input type="radio" id="star4" name="rating" value="4" /><label for="star4" title="4 stars"></label>
                                            <input type="radio" id="star3" name="rating" value="3" /><label for="star3" title="3 stars"></label>
                                            <input type="radio" id="star2" name="rating" value="2" /><label for="star2" title="2 stars"></label>
                                            <input type="radio" id="star1" name="rating" value="1" /><label for="star1" title="1 star"></label>
                                        </div>
                                    </div>
                                    <textarea id="revComment" placeholder="Your comments..." required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 60px;"></textarea>
                                    <button type="submit" class="btn primary" style="width: 100%; margin-top: 10px;">Submit Review</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create a temporary modal for full info
        const modal = document.createElement('div');
        modal.id = 'infoModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content info-modal-content">
                <span class="close-modal" onclick="document.getElementById('infoModal').remove()">&times;</span>
                ${infoHtml}
                <div class="modal-actions" style="margin-top: 20px;">
                    <button class="btn primary" onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}'); document.getElementById('infoModal').remove();">Add to Cart</button>
                    <button class="btn secondary" onclick="document.getElementById('infoModal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    };

    window.submitReview = async function(productId) {
        const name = document.getElementById('revName').value;
        const ratingElement = document.querySelector('input[name="rating"]:checked');
        if (!ratingElement) return alert("Please select a rating star");
        const rating = ratingElement.value;
        const comment = document.getElementById('revComment').value;

        try {
            const response = await fetch(`${API_BASE}/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment })
            });

            if (response.ok) {
                alert("Review submitted successfully!");
                // Refresh modal
                document.getElementById('infoModal').remove();
                showProductInfo(productId);
            } else {
                const data = await response.json();
                alert("Failed to submit review: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Review submission failed:", error);
            alert("Error connecting to server. Please try again.");
        }
    };

    function createServiceCard(service) {
        return `
            <div class="product-card service-card">
                <span class="product-status status-available">Service</span>
                <img src="${service.image || '../Image/spa-service.png'}" alt="${service.name}" onerror="this.src='../Image/placeholder.png'">
                <div class="card-content">
                    <p class="brand">${service.category || 'Spa & Beauty'}</p>
                    <h3>${service.name}</h3>
                    <p class="price">₦${parseFloat(service.price).toLocaleString()}</p>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn primary" onclick="openBookingModal('${service._id || service.id}', '${service.name.replace(/'/g, "\\'")}')">Book Now</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductRows(filterCat = "All", searchTerm = "") {
        console.log("Rendering products...", { filterCat, searchTerm, productsCount: productData.length });
        if (!productRowsContainer) {
            console.error("productRowsContainer not found!");
            return;
        }

        try {
            let filteredProducts = productData;
            let filteredServices = [];

            // DYNAMIC CATEGORIES
            let productCategories = [...new Set(productData.map(p => p.category))];
            let listCategories = (categories && categories.length > 0) ? categories.map(c => typeof c === 'string' ? c : c.name) : [];
            let dynamicCategories = [...new Set([...productCategories, ...listCategories])].filter(Boolean).sort();
            
            // Update the category select dropdown
            const catSelect = document.getElementById('catSelect');
            if (catSelect) { 
                const currentVal = catSelect.value;
                catSelect.innerHTML = `<option value="All">All Categories</option>` + 
                    dynamicCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
                if (dynamicCategories.includes(currentVal) || currentVal === "All") {
                    catSelect.value = currentVal;
                }
            }

            // Filter by Category
            if (filterCat !== "All") {
                filteredProducts = filteredProducts.filter(p => p.category === filterCat);
                if (filterCat === "Spa") {
                    filteredServices = spaServices;
                }
            } else if (searchTerm) {
                filteredServices = spaServices;
            }

            // Filter by Search Term
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                filteredProducts = filteredProducts.filter(p => 
                    p.name.toLowerCase().includes(lowerSearch) || 
                    (p.brand && p.brand.toLowerCase().includes(lowerSearch))
                );
                filteredServices = filteredServices.filter(s => 
                    s.name.toLowerCase().includes(lowerSearch)
                );
            }

            const totalResults = filteredProducts.length + filteredServices.length;

            if (filterCat !== "All" || searchTerm !== "") {
                productRowsContainer.innerHTML = `
                    <div class="search-results">
                        <h2 class="row-title">
                            ${filterCat === 'All' ? 'Search' : filterCat} Results (${totalResults})
                        </h2>
                        <div class="product-grid">
                            ${filteredProducts.map(p => createProductCard(p)).join('')}
                            ${filteredServices.map(s => createServiceCard(s)).join('')}
                            ${totalResults === 0 ? '<p class="no-results">No results found.</p>' : ''}
                        </div>
                    </div>
                `;
            } else {
                // Default View
                let html = dynamicCategories.map((cat, index) => {
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

                if (spaServices.length > 0) {
                    // Group spa services by category
                    const spaCategoriesList = (spaCategories && spaCategories.length > 0) ? spaCategories.map(c => typeof c === 'string' ? c : c.name) : ["Salon & Beauty", "Spa and Wellness", "Massage"];
                    const uniqueSpaCats = [...new Set([...spaServices.map(s => s.category), ...spaCategoriesList])].filter(Boolean);

                    uniqueSpaCats.forEach(cat => {
                        const servicesInCat = spaServices.filter(s => s.category === cat);
                        if (servicesInCat.length === 0) return;

                        html += `
                            <div class="row-container animate-on-scroll spa-services-section" style="margin-top: 50px; background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h2 class="row-title" style="display: flex; padding: 0; margin: 10px 0px 10px 0; font-size: 2rem;">🧖‍♀️ Spa and Wellness</h2>
                                    <button class="btn primary" onclick="openModal('spaManagementModal')">+ Add New Service</button>
                                </div>
                                <p style="color: #000000; font-size: 1rem; margin-bottom: 30px; font-style: italic;">Rejuvenated your body and refresh your natural glow.</p>
                                <div class="product-grid">
                                    ${servicesInCat.map(s => createServiceCard(s)).join('')}
                                </div>
                            </div>
                        `;
                    });
                } else {
                    // Always show the section with an add button so services can be added
                    html += `
                        <div class="row-container animate-on-scroll spa-services-section" style="margin-top: 50px; background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h2 class="row-title" style="display: flex; padding: 0; margin: 10px 0px 10px 0; font-size: 2rem;">🧖‍♀️ Spa and Wellness</h2>
                                <button class="btn primary" onclick="openModal('spaManagementModal')" style>+ Add New Service</button>
                            </div>
                            <p style="color: #000000; font-size: 1rem; margin-bottom: 20px; font-style: italic;">Rejuvenated your body and refresh your natural glow.</p>
                            <p class="no-results">No services found. Add some services for customers to book!</p>
                        </div>
                    `;
                }

                productRowsContainer.innerHTML = html || '<p class="no-results">No products to display.</p>';
                setupSliders();
            }
            
            // Re-run observer
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('active');
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        } catch (err) {
            console.error("Render error:", err);
            productRowsContainer.innerHTML = '<p class="error">Error rendering products. Please refresh.</p>';
        }
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

    // Initial Fetch
    // fetchProducts(); (Called earlier now)

    const spaServiceForm = document.getElementById('spaServiceForm');
    if (spaServiceForm) {
        spaServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('sId').value;
            const serviceData = {
                name: document.getElementById('sName').value,
                category: document.getElementById('sCategory').value,
                units: document.getElementById('sUnits').value,
                price: parseFloat(document.getElementById('sPrice').value)
            };

            const token = getAdminToken(); // Collection page might not have this, but keeping logic consistent

            try {
                let response;
                if (id) {
                    response = await fetch(`${API_BASE}/services/${id}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(serviceData)
                    });
                } else {
                    response = await fetch(`${API_BASE}/services`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(serviceData)
                    });
                }

                if (response.ok) {
                    alert('Service saved successfully!');
                    closeModal('spaManagementModal');
                    fetchProducts();
                } else {
                    alert('Failed to save service. Are you logged in as admin?');
                }
            } catch (error) {
                console.error('Service sync error:', error);
            }
        });
    }

    window.editSpaService = function(id) {
        const s = spaServices.find(s => s._id === id || s.id === id);
        if (!s) return;
        document.getElementById('sId').value = s._id || s.id;
        document.getElementById('sName').value = s.name;
        document.getElementById('sCategory').value = s.category;
        document.getElementById('sUnits').value = s.units;
        document.getElementById('sPrice').value = s.price;
        openModal('spaManagementModal');
    };

    window.deleteSpaService = async function(id) {
        if (confirm('Delete this service?')) {
            const token = getAdminToken();
            try {
                const response = await fetch(`${API_BASE}/services/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    fetchProducts();
                }
            } catch (e) { console.error(e); }
        }
    };

    window.openBookingModal = function(id, name) {
        document.getElementById('bookingServiceId').value = id;
        document.getElementById('bookingServiceName').innerText = name;
        openModal('bookingModal');
    };

    /* --- PREVIOUS ORDERING LOGIC (COMMENTED OUT) ---
    window.openOrderModal = function(id, name, price) {
        document.getElementById('orderProductId').value = id;
        document.getElementById('orderProductName').innerText = name;
        document.getElementById('orderProductPrice').value = price;
        document.getElementById('orderTotalDisplay').innerText = parseFloat(price).toLocaleString();
        openModal('orderModal');
    };

    const orderCustQty = document.getElementById('orderCustQty');
    if (orderCustQty) {
        orderCustQty.addEventListener('input', () => {
            const price = parseFloat(document.getElementById('orderProductPrice').value);
            const qty = parseInt(orderCustQty.value) || 1;
            document.getElementById('orderTotalDisplay').innerText = (price * qty).toLocaleString();
        });
    }

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productId = document.getElementById('orderProductId').value;
            const productName = document.getElementById('orderProductName').innerText;
            const price = parseFloat(document.getElementById('orderProductPrice').value);
            const qty = parseInt(document.getElementById('orderCustQty').value);
            
            const orderData = {
                customerName: document.getElementById('orderCustName').value,
                customerEmail: document.getElementById('orderCustEmail').value,
                customerPhone: document.getElementById('orderCustPhone').value,
                shippingAddress: document.getElementById('orderCustAddress').value,
                items: [{
                    productId: productId,
                    productName: productName,
                    quantity: qty,
                    price: price
                }],
                totalAmount: price * qty,
                paymentMethod: 'Cash on Delivery',
                notes: document.getElementById('orderCustNote').value
            };

            // Trigger WhatsApp message immediately to avoid browser pop-up blockers
            const waMessage = `New Order from ${orderData.customerName}:\nProduct: ${productName}\nQty: ${qty}\nTotal: ₦${orderData.totalAmount}\nAddress: ${orderData.shippingAddress}\nPhone: ${orderData.customerPhone}`;
            window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');
            closeModal('orderModal');

            try {
                const response = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    console.log('Order recorded in database');
                } else {
                    const err = await response.json();
                    console.error('Database order recording failed:', err.message);
                }
            } catch (error) {
                console.error('Database order connection error:', error);
            }
        });
    }
    */

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const serviceId = document.getElementById('bookingServiceId').value;
            const name = document.getElementById('custName').value;
            const contact = document.getElementById('custContact').value;
            const note = document.getElementById('bookingNote').value;
            
            const service = spaServices.find(s => s._id == serviceId || s.id == serviceId);
            if (!service) return alert('Service not found');

            const bookingData = {
                serviceId,
                serviceName: service.name,
                customerName: name,
                customerContact: contact,
                note
            };

            const waMsg = `Hello Shayors, I want to book a spa service:\nService: ${service.name}\nName: ${name}\nContact: ${contact}\nNote: ${note}`;
            window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMsg)}`, '_blank');

            try {
                const response = await fetch(`${API_BASE}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });

                if (response.ok) {
                    console.log('Booking recorded in database');
                    // Also update local sales history for consistency if needed
                    const sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                    const newSale = {
                        id: 'SPA' + Date.now(),
                        date: new Date().toLocaleDateString(),
                        customer: name,
                        items: `${service.name} (spa)`,
                        total: service.price,
                        status: 'Paid',
                        method: 'WhatsApp Booking',
                        platform: 'WhatsApp'
                    };
                    sales.push(newSale);
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));
                    
                    closeModal('bookingModal');
                    alert('Booking request sent and recorded!');
                } else {
                    console.error('Database booking recording failed');
                    closeModal('bookingModal');
                    alert('Booking request sent via WhatsApp!');
                }
            } catch (error) {
                console.error('Database booking connection error:', error);
                closeModal('bookingModal');
                alert('Booking request sent via WhatsApp!');
            }
        });
    }
});
