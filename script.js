document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const navSlide = () => {
        const burger = document.querySelector('.burger');
        const nav = document.querySelector('.nav-links');
        const navLinks = document.querySelectorAll('.nav-links li');

        if (burger) {
            burger.addEventListener('click', () => {
                // Toggle Nav
                nav.classList.toggle('nav-active');

                // Animate Links
                navLinks.forEach((link, index) => {
                    if (link.style.animation) {
                        link.style.animation = '';
                    } else {
                        link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                    }
                });

                // Burger Animation
                burger.classList.toggle('toggle');
            });
        }
    };

    // Intersection Observer for Scroll Animations
    const scrollAnimation = () => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Once animated, stop observing
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => observer.observe(el));
    };

    // Smooth Scrolling for anchor links
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                    // Close mobile nav if open
                    const nav = document.querySelector('.nav-links');
                    const burger = document.querySelector('.burger');
                    if (nav && nav.classList.contains('nav-active')) {
                        nav.classList.remove('nav-active');
                        burger.classList.remove('toggle');
                    }
                }
            });
        });
    };

    // Initialize all functions
    navSlide();
    scrollAnimation();
    smoothScroll();

    // --- HOME SEARCH LOGIC ---
    const initHomeSearch = () => {
        const homeSearch = document.getElementById('homeSearch');
        const suggestionsDropdown = document.getElementById('searchSuggestions');
        if (!homeSearch || !suggestionsDropdown) return;

        let allProducts = [];

        const isLocal = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1" || 
                        window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.') || 
                        window.location.hostname.startsWith('172.');

        const API_BASE = isLocal 
            ? `http://${window.location.hostname}:5000/api` 
            : "https://cosmetics-website.fly.dev/api";

        // Fetch products for search
        fetch(`${API_BASE}/products`)
            .then(res => res.json())
            .then(data => {
                allProducts = data;
            })
            .catch(err => console.error("Search fetch failed:", err));

        homeSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                suggestionsDropdown.innerHTML = '';
                suggestionsDropdown.classList.add('hidden');
                return;
            }

            const matches = allProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.brand && p.brand.toLowerCase().includes(query))
            ).slice(0, 8); // Limit to 8 suggestions

            if (matches.length > 0) {
                suggestionsDropdown.innerHTML = matches.map(p => `
                    <div class="suggestion-item" data-id="${p._id}" data-cat="${p.category || 'All'}" data-name="${p.name}">
                        <img src="${p.image || './Image/placeholder.png'}" alt="${p.name}">
                        <div class="suggestion-info">
                            <h4>${p.name}</h4>
                            <p>${p.category || 'Product'} | ₦${p.price.toLocaleString()}</p>
                        </div>
                    </div>
                `).join('');
                suggestionsDropdown.classList.remove('hidden');

                // Add click listeners to suggestions
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const name = item.getAttribute('data-name');
                        const cat = item.getAttribute('data-cat');
                        // Redirect to collections page with search parameters
                        window.location.href = `./Collection/collections.html?search=${encodeURIComponent(name)}&cat=${encodeURIComponent(cat)}`;
                    });
                });
            } else {
                suggestionsDropdown.innerHTML = '<div class="suggestion-item"><p>No products found</p></div>';
                suggestionsDropdown.classList.remove('hidden');
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!homeSearch.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
                suggestionsDropdown.classList.add('hidden');
            }
        });
    };

    initHomeSearch();

    // --- GLOBAL MODAL LOGIC ---
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    };

    // --- GLOBAL SHOPPING CART SYSTEM ---
    let cart = JSON.parse(localStorage.getItem('shayorsCart')) || [];
    
    // Initial UI update
    setTimeout(updateCartUI, 100); 

    window.addToCart = function(id, name, price, image) {
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ id, name, price, image, qty: 1 });
        }
        saveCart();
        updateCartUI();
        alert(`${name} added to cart!`);
    };

    function saveCart() {
        localStorage.setItem('shayorsCart', JSON.stringify(cart));
    }

    function updateCartUI() {
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.innerText = count;
    }

    window.openCart = function() {
        const container = document.getElementById('cartItemsContainer');
        const footer = document.getElementById('cartFooter');
        const totalEl = document.getElementById('cartTotalDisplay');
        
        if (!container) return; // Cart HTML might not be on current page yet

        if (cart.length === 0) {
            container.innerHTML = '<p>Your cart is empty.</p>';
            if (footer) footer.classList.add('hidden');
        } else {
            let total = 0;
            container.innerHTML = cart.map((item, index) => {
                total += item.price * item.qty;
                return `
                    <div class="cart-item">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <img src="${item.image}" width="40" height="40" style="object-fit:cover; border-radius:4px;">
                            <div>
                                <strong>${item.name}</strong><br>
                                <small>₦${item.price.toLocaleString()} x ${item.qty}</small>
                            </div>
                        </div>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <button class="btn secondary" style="padding:2px 8px;" onclick="updateCartQty(${index}, -1)">-</button>
                            <input type="number" value="${item.qty}" min="1" 
                                   style="width: 40px; text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 2px 0;"
                                   onchange="setCartQty(${index}, this.value)">
                            <button class="btn secondary" style="padding:2px 8px;" onclick="updateCartQty(${index}, 1)">+</button>
                            <button class="btn danger" style="padding:2px 8px;" onclick="removeFromCart(${index})">×</button>
                        </div>
                    </div>
                `;
            }).join('');
            if (totalEl) totalEl.innerText = total.toLocaleString();
            if (footer) footer.classList.remove('hidden');
        }
        openModal('cartModal');
    };

    window.updateCartQty = function(index, change) {
        cart[index].qty += change;
        if (cart[index].qty < 1) cart.splice(index, 1);
        saveCart();
        updateCartUI();
        openCart(); 
    };

    window.setCartQty = function(index, value) {
        const qty = parseInt(value);
        if (isNaN(qty) || qty < 1) {
            cart.splice(index, 1);
        } else {
            cart[index].qty = qty;
        }
        saveCart();
        updateCartUI();
        openCart();
    };

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
        openCart(); 
    };

    window.goToCheckout = function() {
        closeModal('cartModal');
        openModal('checkoutModal');
    };

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            const orderData = {
                customerName: document.getElementById('checkCustName').value,
                customerEmail: document.getElementById('checkCustEmail').value,
                customerPhone: document.getElementById('checkCustPhone').value,
                shippingAddress: document.getElementById('checkCustAddress').value,
                paymentMethod: document.getElementById('checkPaymentMethod').value,
                notes: document.getElementById('checkCustNote').value,
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.qty,
                    price: item.price
                })),
                totalAmount: total
            };

            const itemsList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
            const waMessage = `New Order from ${orderData.customerName}:\nItems: ${itemsList}\nTotal: ₦${total.toLocaleString()}\nAddress: ${orderData.shippingAddress}\nPhone: ${orderData.customerPhone}\nPayment: ${orderData.paymentMethod}\nNotes: ${orderData.notes || 'None'}`;
            window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');

            const isLocal = window.location.hostname === "localhost" || 
                            window.location.hostname === "127.0.0.1" || 
                            window.location.hostname.startsWith('192.168.') || 
                            window.location.hostname.startsWith('10.') || 
                            window.location.hostname.startsWith('172.');

            const API_BASE = isLocal 
                ? `http://${window.location.hostname}:5000/api` 
                : "https://cosmetics-website.fly.dev/api";

            try {
                const response = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    // Record in local sales history for Analytics module
                    const sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                    const newSale = {
                        id: 'S' + Date.now(),
                        date: new Date().toISOString(),
                        customer: orderData.customerName,
                        contact: orderData.customerPhone,
                        items: orderData.items,
                        total: orderData.totalAmount,
                        status: 'Paid', // Assuming paid for simplicity or check orderData.paymentMethod
                        paymentMethod: orderData.paymentMethod,
                        amountPaid: orderData.totalAmount,
                        platform: 'Web Store',
                        deliveryStatus: 'Pending',
                        type: 'product'
                    };
                    sales.push(newSale);
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));

                    // Record in Customer Database for Record Keeping/Debtors
                    const customers = JSON.parse(localStorage.getItem('shayorsCustomers')) || [];
                    const itemsList = orderData.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
                    const totalUnits = orderData.items.reduce((sum, i) => sum + i.quantity, 0);
                    const debtorRecord = {
                        id: 'C' + Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        invoiceNo: newSale.id,
                        name: orderData.customerName,
                        contact: orderData.customerPhone,
                        product: itemsList,
                        totalUnits: totalUnits,
                        totalAmount: orderData.totalAmount,
                        partlyPaid: orderData.totalAmount, // Assuming fully paid online for now
                        dueDate: '',
                        status: 'Paid'
                    };
                    customers.push(debtorRecord);
                    localStorage.setItem('shayorsCustomers', JSON.stringify(customers));

                    alert('Order placed successfully!');
                    cart = [];
                    saveCart();
                    updateCartUI();
                    closeModal('checkoutModal');
                }
            } catch (error) {
                console.error('Order error:', error);
            }
        });
    }

    // Contact Form Submission (if on contact page)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for contacting Shayors Cosmetics. We will get back to you shortly!');
            contactForm.reset();
        });
    }
});
