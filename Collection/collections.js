document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Storage for Products (Dynamic from API + Fallback)
    const initialProducts = [
        { _id: 'sample_1', category: "Facesoap", name: "Premium Cleanser", brand: "Shayors", shade: "N/A", size: "200ml", ingredients: "Aloe Vera", price: 15000, stock: 20, image: "../Image/WhatsApp1.jpeg" },
        { _id: 'sample_2', category: "Bar soap", name: "Glow Bar", brand: "Shayors", shade: "N/A", size: "150g", ingredients: "Honey", price: 8000, stock: 50, image: "../Image/WhatsApp2.jpeg" },
        { _id: 'sample_3', category: "Cleanser", name: "Deep Pore Cleanser", brand: "Shayors", shade: "N/A", size: "100ml", ingredients: "Salicylic Acid", price: 20000, stock: 15, image: "../Image/WhatsApp3.jpeg" },
        { _id: 'sample_4', category: "Facecream", name: "Day Glow Cream", brand: "Shayors", shade: "N/A", size: "50g", ingredients: "SPF 30", price: 25000, stock: 30, image: "../Image/WhatsApp4.jpeg" },
        { _id: 'sample_5', category: "Bar soap", name: "Exfoliating Soap", brand: "Shayors", shade: "N/A", size: "150g", ingredients: "Oatmeal", price: 10000, stock: 40, image: "../Image/WhatsApp5.jpeg" },
        { _id: 'sample_6', category: "Cleanser", name: "Luxury Mist", brand: "Shayors", shade: "N/A", size: "150ml", ingredients: "Rose Water", price: 15000, stock: 25, image: "../Image/WhatsApp6.jpeg" },
        { _id: 'sample_7', category: "Perfume oil", name: "Midnight Scent", brand: "Shayors", shade: "N/A", size: "30ml", ingredients: "Oud", price: 35000, stock: 10, image: "../Image/WhatsApp7.jpeg" },
        { _id: 'sample_8', category: "Scrub", name: "Sugar Glow Scrub", brand: "Shayors", shade: "N/A", size: "250g", ingredients: "Sugar", price: 18000, stock: 20, image: "../Image/WhatsApp8.jpeg" },
        { _id: 'sample_9', category: "Lotion", name: "Hydrating Body Milk", brand: "Shayors", shade: "N/A", size: "400ml", ingredients: "Cocoa Butter", price: 22000, stock: 15, image: "../Image/WhatsApp9.jpeg" },
        { _id: 'sample_10', category: "Serum", name: "Vitamin C Serum", brand: "Shayors", shade: "N/A", size: "30ml", ingredients: "Vit C", price: 30000, stock: 12, image: "../Image/WhatsApp10.jpeg" }
    ];

    let productData = [...initialProducts];
    let spaServices = []; // Will be fetched from API
    const initialCategoriesList = ["Scrub", "Black soap", "Lotion", "Tube", "Oil", "Serum", "Bar soap", "Cleanser", "Toner", "Perfume oil", "Airfreshner", "Gift box", "Tea", "Facesoap", "Body spray", "Roll on", "Lubricant", "Sponge", "Haircare", "Aphrodisiacs", "Cotton pad", "Wipes"];
    let categories = JSON.parse(localStorage.getItem('shayorsCategories')) || initialCategoriesList.map(name => ({ name }));

    const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? "http://localhost:5000/api" 
        : "https://shayors-cosmetics.onrender.com/api";

    // 2. Fetch Data from API (Appends or replaces static data)
    const fetchProducts = async () => {
        const productRowsContainer = document.getElementById('productRowsContainer');
        
        try {
            // Fetch Categories
            const catRes = await fetch(`${API_BASE}/categories`);
            if (catRes.ok) {
                const data = await catRes.json();
                if (Array.isArray(data) && data.length > 0) {
                    categories = data;
                    localStorage.setItem('shayorsCategories', JSON.stringify(categories));
                }
            }

            // Fetch Products
            const prodRes = await fetch(`${API_BASE}/products`);
            if (prodRes.ok) {
                const apiData = await prodRes.json();
                if (apiData && apiData.length > 0) {
                    productData = apiData; 
                } else {
                    productData = [...initialProducts];
                }
            }

            // Fetch Services
            const servRes = await fetch(`${API_BASE}/services`);
            if (servRes.ok) {
                spaServices = await servRes.json();
            }

            renderProductRows();
        } catch (error) {
            console.error('API unavailable');
            renderProductRows(); // Fallback to initialProducts
        }
    };

    // 3. Render Search UI (Categories will be added dynamically after fetch)
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

    // 4. Render Product Rows (Default View)
    const productRowsContainer = document.getElementById('productRowsContainer');

    function createProductCard(product) {
        const available = product.stock > 0;
        return `
            <div class="product-card">
                <span class="product-status ${available ? 'status-available' : 'status-unavailable'}">
                    ${available ? 'In Stock' : 'Out of Stock'}
                </span>
                <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}">
                <div class="card-content">
                    <p class="brand">${product.brand || 'Shayors'}</p>
                    <h3>${product.name}</h3>
                    <p class="price">₦${parseFloat(product.price).toLocaleString()}</p>
                    <p class="qty">Qty Available: ${product.stock}</p>
                    
                    <div class="product-details-mini">
                        ${product.skinTypes ? `<p><strong>Skin Type:</strong> ${product.skinTypes}</p>` : ''}
                        ${product.skinConcern ? `<p><strong>Concern:</strong> ${product.skinConcern}</p>` : ''}
                    </div>

                    <div class="card-actions">
                        <button class="btn primary" ${available ? '' : 'disabled'} onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                            ${available ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button class="btn secondary info-btn" onclick="showProductInfo('${product._id}')">Details</button>
                    </div>
                </div>
            </div>
        `;
    }

    window.showProductInfo = function(id) {
        const product = productData.find(p => p._id === id);
        if (!product) return;

        const infoHtml = `
            <div class="product-info-modal">
                <div class="info-grid">
                    <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}">
                    <div class="info-text">
                        <h2>${product.name}</h2>
                        <p class="info-brand">By ${product.brand || 'Shayors'}</p>
                        <p class="info-price">₦${parseFloat(product.price).toLocaleString()}</p>
                        <hr>
                        ${product.description ? `<div class="info-section"><h4>Description</h4><p>${product.description}</p></div>` : ''}
                        ${product.skinTypes ? `<div class="info-section"><h4>Skin Types</h4><p>${product.skinTypes}</p></div>` : ''}
                        ${product.skinConcern ? `<div class="info-section"><h4>Skin Concern</h4><p>${product.skinConcern}</p></div>` : ''}
                        ${product.howToUse ? `<div class="info-section"><h4>How to Use</h4><p>${product.howToUse}</p></div>` : ''}
                        ${product.ingredients ? `<div class="info-section"><h4>Ingredients</h4><p>${product.ingredients}</p></div>` : ''}
                        ${product.review ? `<div class="info-section"><h4>Review</h4><p>${product.review}</p></div>` : ''}
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
                <div class="modal-actions">
                    <button class="btn primary" onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}'); document.getElementById('infoModal').remove();">Add to Cart</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.remove('hidden');
    };

    function createServiceCard(service) {
        return `
            <div class="product-card service-card">
                <span class="product-status status-available">Service</span>
                <img src="../Image/spa-service.png" alt="${service.name}" onerror="this.src='../Image/placeholder.png'">
                <div class="card-content">
                    <p class="brand">${service.category || 'Spa & Beauty'}</p>
                    <h3>${service.name}</h3>
                    <p class="price">₦${parseFloat(service.price).toLocaleString()}</p>
                    <p class="qty">Unit: ${service.units || service.unit || 'Session'}</p>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn primary" onclick="openBookingModal(${service.id}, '${service.name.replace(/'/g, "\\'")}')">Book Now</button>
                        <button class="btn secondary" style="background: #555; font-size: 0.6rem; padding: 5px 10px;" onclick="editSpaService(${service.id})">Edit</button>
                        <button class="btn danger" style="font-size: 0.6rem; padding: 5px 10px;" onclick="deleteSpaService(${service.id})">Del</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductRows(filterCat = "All", searchTerm = "") {
        if (!productRowsContainer) return;

        let filteredProducts = productData;
        let filteredServices = [];

        // DYNAMIC CATEGORIES: Use categories from API or extract unique categories from actual product data
        let dynamicCategories = [];
        if (categories && categories.length > 0) {
            dynamicCategories = categories.map(c => c.name).sort();
        } else {
            dynamicCategories = [...new Set(productData.map(p => p.category))].sort();
        }
        
        // Update the category select dropdown in navigation dynamically
        const catSelect = document.getElementById('catSelect');
        if (catSelect) { 
            const currentVal = catSelect.value;
            catSelect.innerHTML = `<option value="All">All Categories</option>` + 
                dynamicCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            // Restore selection if it still exists in the new list
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
        } else {
            if (searchTerm) {
                filteredServices = spaServices;
            }
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
            // Default View: Show rows for ALL categories currently in the database
            let html = dynamicCategories.map((cat, index) => {
                const productsInCat = productData.filter(p => p.category === cat);
                if (productsInCat.length === 0 || cat === "Spa") return '';

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

            if (spaServices.length > 0 || true) {
                html += `
                    <div class="row-container animate-on-scroll spa-services-section" style="margin-top: 50px; background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                            <h2 class="row-title" style="margin: 0; font-size: 2rem;">🧖‍♀️ Our Spa & Beauty Services</h2>
                            <button class="btn primary" onclick="openModal('spaManagementModal')">+ Add New Service</button>
                        </div>
                        <p style="text-align: center; margin-bottom: 40px; color: #777;">Indulge in our professional spa treatments designed for your relaxation and beauty.</p>
                        <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                            ${spaServices.length > 0 ? 
                                spaServices.map(s => createServiceCard(s)).join('') : 
                                '<p style="grid-column: 1/-1; text-align: center;">No spa services added yet.</p>'}
                        </div>
                    </div>
                `;
            }

            productRowsContainer.innerHTML = html;
            setupSliders();
        }
        
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
    fetchProducts();

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

            const token = sessionStorage.getItem('shayorsAdminToken'); // Collection page might not have this, but keeping logic consistent

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
            const token = sessionStorage.getItem('shayorsAdminToken');
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
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const serviceId = document.getElementById('bookingServiceId').value;
            const service = spaServices.find(s => s.id == serviceId);
            const name = document.getElementById('custName').value;
            const contact = document.getElementById('custContact').value;
            const note = document.getElementById('bookingNote').value;

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

            const waMsg = `Hello Shayors, I want to book a spa service:\nService: ${service.name}\nName: ${name}\nContact: ${contact}\nNote: ${note}`;
            window.open(`https://wa.me/234XXXXXXXXXX?text=${encodeURIComponent(waMsg)}`, '_blank');
            closeModal('bookingModal');
            alert('Booking request sent via WhatsApp!');
        });
    }
});
