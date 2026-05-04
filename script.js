document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for Offline Access
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swPath = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                ? '/service-worker.js' 
                : '/service-worker.js'; // Adjust path if needed for subdirectories
            
            // Check if we are in a subdirectory like /Collection/ or /Inventory/
            const isSubDir = window.location.pathname.includes('/Collection/') || 
                             window.location.pathname.includes('/About/') || 
                             window.location.pathname.includes('/Contact/') ||
                             window.location.pathname.includes('/Inventory/');
            
            const finalPath = isSubDir ? '../service-worker.js' : './service-worker.js';

            navigator.serviceWorker.register(finalPath)
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

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

        // SET THIS TO FALSE to use the LOCAL server data while working locally
        const USE_LIVE_DATA_LOCALLY = false;

        const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
            ? `http://${window.location.hostname}:5000/api` 
            : "https://cosmetics-website.fly.dev/api";

        // Don't fetch products here if we're on the Inventory or Collections page (handled by their respective JS)
        if (window.location.pathname.includes('inventory.html') || window.location.pathname.includes('collections.html')) {
            console.log("Skipping product fetch in script.js (page has its own fetch)");
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for Fly.io

        // Fetch products for search
        fetch(`${API_BASE}/products`, { signal: controller.signal })
            .then(res => {
                clearTimeout(timeoutId);
                return res.json();
            })
            .then(data => {
                allProducts = data;
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error("Search fetch failed or timed out:", err);
            });

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
            
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing Order...";
            submitBtn.disabled = true;

            const receiptLink = document.getElementById('checkReceiptLink').value.trim();
            const receiptFile = document.getElementById('checkReceiptFile').files[0];

            if (!receiptLink && !receiptFile) {
                alert("Please provide a payment receipt (Link or File) before completing your order.");
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                return;
            }

            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            const orderData = {
                customerName: document.getElementById('checkCustName').value,
                customerEmail: document.getElementById('checkCustEmail').value,
                customerPhone: document.getElementById('checkCustPhone').value,
                shippingAddress: document.getElementById('checkCustAddress').value,
                paymentMethod: document.getElementById('checkPaymentMethod').value,
                notes: document.getElementById('checkCustNote').value,
                receiptInfo: receiptLink || (receiptFile ? `File: ${receiptFile.name}` : 'N/A'),
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.qty,
                    price: item.price
                })),
                totalAmount: total,
                platform: 'Web Store'
            };

            const isLocal = window.location.hostname === "localhost" || 
                            window.location.hostname === "127.0.0.1" || 
                            window.location.hostname.startsWith('192.168.') || 
                            window.location.hostname.startsWith('10.') || 
                            window.location.hostname.startsWith('172.');

            const USE_LIVE_DATA_LOCALLY = false;
            const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
                ? `http://${window.location.hostname}:5000/api` 
                : "https://cosmetics-website.fly.dev/api";

            try {
                // 1. Send to Backend First (This triggers Email & Dashboard record)
                const response = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const createdOrder = await response.json();
                    
                    // 2. Open WhatsApp (Now that we know it's saved)
                    const itemsList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
                    const waMessage = `New Order from ${orderData.customerName}:\nOrder ID: ${createdOrder._id}\nItems: ${itemsList}\nTotal: ₦${total.toLocaleString()}\nAddress: ${orderData.shippingAddress}\nPhone: ${orderData.customerPhone}\nPayment: ${orderData.paymentMethod}\nReceipt: ${orderData.receiptInfo}`;
                    window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');

                    // 3. Update Local Records
                    const sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                    sales.push({
                        ...orderData,
                        id: createdOrder._id,
                        date: new Date().toISOString(),
                        status: 'Unpaid',
                        amountPaid: 0,
                        type: 'product'
                    });
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));

                    alert('Order placed successfully! Redirecting to WhatsApp for confirmation...');
                    cart = [];
                    saveCart();
                    updateCartUI();
                    closeModal('checkoutModal');
                } else {
                    const err = await response.json();
                    alert(`Order failed: ${err.message || 'Please try again.'}`);
                }
            } catch (error) {
                console.error('Order error:', error);
                alert('Connection error. Please check your internet and try again.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
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
