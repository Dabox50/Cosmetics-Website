document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Storage for Products (Dynamic from API)
    let productData = [];
    let spaServices = JSON.parse(localStorage.getItem('shayorsSpaServices')) || [];

    // 2. Fetch Data from API (Appends or replaces static data)
    const fetchProducts = async () => {
        try {
            const response = await fetch('https://shayors-cosmetics.onrender.com/api/products');
            if (response.ok) {
                const apiData = await response.json();
                productData = apiData; // Use live data
                renderProductRows();
            } else {
                productData = []; // Clear if API fails or returns error
                renderProductRows();
            }
        } catch (error) {
            console.error('API unavailable');
            productData = []; // Clear if API unavailable
            renderProductRows();
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
                    <button class="btn primary" ${available ? '' : 'disabled'} onclick="openOrderModal('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
                        ${available ? 'Order Now' : 'Join Waitlist'}
                    </button>
                </div>
            </div>
        `;
    }

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

        // DYNAMIC CATEGORIES: Extract unique categories from actual product data
        const dynamicCategories = [...new Set(productData.map(p => p.category))].sort();
        
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

    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            if (modalId === 'spaManagementModal') {
                document.getElementById('spaServiceForm').reset();
                document.getElementById('sId').value = '';
            }
        }
    };

    const spaServiceForm = document.getElementById('spaServiceForm');
    if (spaServiceForm) {
        spaServiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('sId').value;
            const serviceData = {
                id: id ? parseInt(id) : Date.now(),
                name: document.getElementById('sName').value,
                category: document.getElementById('sCategory').value,
                units: document.getElementById('sUnits').value,
                price: parseFloat(document.getElementById('sPrice').value)
            };

            if (id) {
                const index = spaServices.findIndex(s => s.id === parseInt(id));
                if (index !== -1) spaServices[index] = serviceData;
            } else {
                spaServices.push(serviceData);
            }

            localStorage.setItem('shayorsSpaServices', JSON.stringify(spaServices));
            closeModal('spaManagementModal');
            location.reload();
        });
    }

    window.editSpaService = function(id) {
        const s = spaServices.find(s => s.id === id);
        if (!s) return;
        document.getElementById('sId').value = s.id;
        document.getElementById('sName').value = s.name;
        document.getElementById('sCategory').value = s.category;
        document.getElementById('sUnits').value = s.units;
        document.getElementById('sPrice').value = s.price;
        openModal('spaManagementModal');
    };

    window.deleteSpaService = function(id) {
        if (confirm('Delete this service?')) {
            spaServices = spaServices.filter(s => s.id !== id);
            localStorage.setItem('shayorsSpaServices', JSON.stringify(spaServices));
            location.reload();
        }
    };

    window.openBookingModal = function(id, name) {
        document.getElementById('bookingServiceId').value = id;
        document.getElementById('bookingServiceName').innerText = name;
        openModal('bookingModal');
    };

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
                const response = await fetch('https://shayors-cosmetics.onrender.com/api/orders', {
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
