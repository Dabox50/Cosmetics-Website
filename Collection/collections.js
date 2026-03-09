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
    let spaServices = JSON.parse(localStorage.getItem('shayorsSpaServices')) || [];

    const categories = ["Skincare", "Serum Oil", "Packaging Bottle", "Perfume Oil", "Bar Soap", "Mask", "Sponge", "Patch", "Tube", "Black Soap", "Face & Body Wash", "Facecream", "Spa", "Perfume", "Supplements", "Sunscreen", "Humidifiers", "Diffusers", "Raw Materials"];

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
                <img src="${product.image || '../Image/placeholder.png'}" alt="${product.name}">
                <div class="card-content">
                    <p class="brand">${product.brand || 'Shayors'}</p>
                    <h3>${product.name}</h3>
                    <p class="price">₦${parseFloat(product.price).toLocaleString()}</p>
                    <p class="qty">Qty Available: ${product.stock}</p>
                    <button class="btn primary" ${available ? '' : 'disabled'} onclick="openOrderModal(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">
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

        // Filter by Category
        if (filterCat !== "All") {
            filteredProducts = filteredProducts.filter(p => p.category === filterCat);
            if (filterCat === "Spa") {
                filteredServices = spaServices;
            }
        } else {
            // "All" includes all products and all services if searching
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

        // If filtering/searching is active, show grid
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
            // Default: Show Horizontal Rows (Sliders) for all categories with products
            const rowsToShow = categories;
            
            let html = rowsToShow.map((cat, index) => {
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

            // Add dedicated Spa Services Section at the bottom
            if (spaServices.length > 0 || true) { // Always show if we want "Add" button
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

    // 5. Spa Service Management & Booking Logic
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
            location.reload(); // Refresh to show new data
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

    // Booking Logic
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
                    productId: productId.toString(),
                    productName: productName,
                    quantity: qty,
                    price: price
                }],
                totalAmount: price * qty,
                paymentMethod: 'Cash on Delivery', // Default
                notes: document.getElementById('orderCustNote').value
            };

            try {
                // Change URL to your production backend URL when deployed
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const savedOrder = await response.json();
                    alert('Order placed successfully! We will contact you soon.');
                    
                    // Optional: WhatsApp redirect
                    const waMessage = `New Order from ${orderData.customerName}:\nProduct: ${productName}\nQty: ${qty}\nTotal: ₦${orderData.totalAmount}\nAddress: ${orderData.shippingAddress}`;
                    window.open(`https://wa.me/2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');
                    
                    closeModal('orderModal');
                } else {
                    const err = await response.json();
                    alert(`Failed to place order: ${err.message}`);
                }
            } catch (error) {
                console.error('Order error:', error);
                alert('Server error. Is the backend running?');
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

            // Record as Sale in Inventory
            const sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
            const newSale = {
                id: 'SPA' + Date.now(),
                date: new Date().toISOString(),
                customer: name,
                contact: contact,
                items: [{
                    name: service.name,
                    qty: 1,
                    unitType: service.units || 'Session',
                    price: service.price,
                    total: service.price
                }],
                total: service.price,
                status: 'Not Paid', // Default status for new booking
                platform: 'Website Booking',
                note: note,
                type: 'spa'
            };

            sales.push(newSale);
            localStorage.setItem('shayorsSales', JSON.stringify(sales));

            // Also record in Customers DB
            const customers = JSON.parse(localStorage.getItem('shayorsCustomers')) || [];
            customers.push({
                id: 'C' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                invoiceNo: newSale.id,
                name: name,
                contact: contact,
                product: service.name,
                totalAmount: service.price,
                partlyPaid: 0,
                status: 'Not Paid'
            });
            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));

            alert('Booking confirmed! Admin has been notified via dashboard records.');
            closeModal('bookingModal');
            
            // Optional: WhatsApp Notification
            const msg = `*New Spa Booking*%0AService: ${service.name}%0ACustomer: ${name}%0AContact: ${contact}%0ANote: ${note}`;
            window.open(`https://wa.me/2348123456789?text=${msg}`);
        });
    }
});
