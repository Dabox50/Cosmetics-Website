const MAINTENANCE_MODE = false; // Change to true to deactivate the site

if (MAINTENANCE_MODE && !window.location.pathname.includes('inventory.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #fdfbf7; font-family: 'Playfair Display', serif; padding: 20px;">
                <img src="${window.location.pathname.includes('Collection') || window.location.pathname.includes('About') || window.location.pathname.includes('Contact') ? '../Image/Shayor\'s Logo.png' : './Image/Shayor\'s Logo.png'}" alt="Logo" width="150" style="margin-bottom: 20px;">
                <h1 style="color: #d4af37; font-size: 2.5rem; margin-bottom: 15px;">Currently Offline</h1>
                <p style="color: #2c2c2c; font-size: 1.2rem; max-width: 600px; line-height: 1.6;">We are currently updating our collections to bring you the best in luxury skincare. Please check back shortly!</p>
                <div style="margin-top: 30px; display: flex; gap: 15px;">
                    <a href="https://wa.me/+2348189085285" style="padding: 12px 25px; background: #25d366; color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-family: 'Montserrat', sans-serif;">WhatsApp Us</a>
                    <a href="https://instagram.com/shayors_cosmetics" style="padding: 12px 25px; background: #e4405f; color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-family: 'Montserrat', sans-serif;">Instagram</a>
                </div>
            </div>
        `;
        document.body.style.display = 'block';
    });
}

// Toast notification helper - replaces browser alert() calls
window.showToast = function(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.setProperty('--toast-duration', duration + 'ms');
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-body">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-out');setTimeout(()=>this.parentElement.remove(),300)">&times;</button>
        <div class="toast-progress"></div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
};

document.addEventListener('DOMContentLoaded', () => {
    if (MAINTENANCE_MODE && !window.location.pathname.includes('inventory.html')) return;
    // Register Service Worker for Offline Access + Auto-Update
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Check if we are in a subdirectory like /Collection/ or /Inventory/
            const isSubDir = window.location.pathname.includes('/Collection/') || 
                             window.location.pathname.includes('/About/') || 
                             window.location.pathname.includes('/Contact/') ||
                             window.location.pathname.includes('/Inventory/');
            
            const finalPath = isSubDir ? '../service-worker.js' : './service-worker.js';

            navigator.serviceWorker.register(finalPath)
                .then(registration => {
                    

                    // Check for updates immediately
                    registration.update();

                    // When a new service worker is found, force it to activate
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available — tell it to take over now
                                    
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                }
                            });
                        }
                    });

                    // When the new SW takes control, reload to get fresh assets
                    let refreshing = false;
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        if (!refreshing) {
                            refreshing = true;
                            
                            window.location.reload();
                        }
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // Robust Mobile Navigation Toggle with Backdrop & Outside Click
    const navSlide = () => {
        const burger = document.querySelector('.burger');
        const nav = document.querySelector('.nav-links');
        const navLinks = document.querySelectorAll('.nav-links li');
        
        if (!burger || !nav) return;

        // Ensure backdrop element exists
        let backdrop = document.querySelector('.nav-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'nav-backdrop';
            document.body.appendChild(backdrop);
        }

        const openMenu = () => {
            nav.classList.add('nav-active');
            burger.classList.add('toggle');
            backdrop.classList.add('active');
            document.body.classList.add('nav-open');

            navLinks.forEach((link, index) => {
                link.style.animation = `navLinkFade 0.35s ease forwards ${index * 0.08 + 0.15}s`;
            });
        };

        const closeMenu = () => {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
            backdrop.classList.remove('active');
            document.body.classList.remove('nav-open');

            navLinks.forEach((link) => {
                link.style.animation = '';
            });
        };

        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (nav.classList.contains('nav-active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        backdrop.addEventListener('click', closeMenu);

        // Close when clicking any nav link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('nav-active')) {
                closeMenu();
            }
        });

        // Close when resizing window past 980px
        window.addEventListener('resize', () => {
            if (window.innerWidth > 980 && nav.classList.contains('nav-active')) {
                closeMenu();
            }
        });
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
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth'
                        });
                        // Close mobile nav if open
                        const nav = document.querySelector('.nav-links');
                        const burger = document.querySelector('.burger');
                        const backdrop = document.querySelector('.nav-backdrop');
                        if (nav && nav.classList.contains('nav-active')) {
                            nav.classList.remove('nav-active');
                            if (burger) burger.classList.remove('toggle');
                            if (backdrop) backdrop.classList.remove('active');
                            document.body.classList.remove('nav-open');
                        }
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

        // SET THIS TO TRUE to use the LIVE server data while working locally via Live Server
        const USE_LIVE_DATA_LOCALLY = true;

        const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
            ? `http://${window.location.hostname}:5000/api` 
            : "https://cosmetics-website.fly.dev/api";

        // Don't fetch products here if we're on the Inventory or Collections page (handled by their respective JS)
        if (window.location.pathname.includes('inventory.html') || window.location.pathname.includes('collections.html')) {
            
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
                        const isSubDir = window.location.pathname.includes('/Collection/') || 
                                         window.location.pathname.includes('/About/') || 
                                         window.location.pathname.includes('/Contact/') ||
                                         window.location.pathname.includes('/Inventory/');
                        const collUrl = isSubDir ? '../Collection/collections.html' : './Collection/collections.html';
                        window.location.href = `${collUrl}?search=${encodeURIComponent(name)}&cat=${encodeURIComponent(cat)}`;
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
        showToast(`${name} added to cart!`, 'success');
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

    // --- Paystack & Checkout Integration ---
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');

    const USE_LIVE_DATA_LOCALLY = true;
    const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
        ? `http://${window.location.hostname}:5000/api` 
        : "https://cosmetics-website.fly.dev/api";

    // Paystack Public Key - can be overridden via window.PAYSTACK_PUBLIC_KEY or backend /api/orders/paystack/key
    let PAYSTACK_PUBLIC_KEY = window.PAYSTACK_PUBLIC_KEY || 'pk_test_8a6511b9f4a37ec467717e292d732da21e1f745a';

    async function fetchPaystackKey() {
        try {
            const res = await fetch(`${API_BASE}/orders/paystack/key`);
            if (res.ok) {
                const data = await res.json();
                if (data.publicKey && data.publicKey.startsWith('pk_')) {
                    PAYSTACK_PUBLIC_KEY = data.publicKey;
                }
            }
        } catch (e) {
            // Silently retain fallback key
        }
    }
    fetchPaystackKey();

    // Helper to dynamically load Paystack Inline SDK if not loaded yet
    function ensurePaystackLoaded() {
        return new Promise((resolve, reject) => {
            if (window.PaystackPop) return resolve(window.PaystackPop);
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => resolve(window.PaystackPop);
            script.onerror = () => reject(new Error('Failed to load Paystack SDK. Check your internet connection.'));
            document.head.appendChild(script);
        });
    }

    // Toggle Payment Method UI (Paystack vs Bank Transfer)
    window.togglePaymentMethodUI = function() {
        const methodSelect = document.getElementById('checkPaymentMethod');
        const bankDetails = document.getElementById('bankDetails');
        const receiptSection = document.getElementById('receiptUploadSection');
        const paystackNotice = document.getElementById('paystackInfoNotice');
        const submitBtn = document.getElementById('checkoutSubmitBtn') || 
            (document.getElementById('checkoutForm') ? document.getElementById('checkoutForm').querySelector('button[type="submit"]') : null);

        const method = methodSelect ? methodSelect.value : 'Paystack';
        const isPaystack = method === 'Paystack';
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        if (bankDetails) bankDetails.style.display = isPaystack ? 'none' : 'block';
        if (receiptSection) receiptSection.style.display = isPaystack ? 'none' : 'block';
        if (paystackNotice) paystackNotice.style.display = isPaystack ? 'block' : 'none';

        if (submitBtn) {
            if (isPaystack) {
                submitBtn.innerText = total > 0 ? `Pay ₦${total.toLocaleString()} with Paystack` : 'Pay with Paystack';
            } else {
                submitBtn.innerText = 'Complete Order';
            }
        }
    };

    window.goToCheckout = function() {
        if (!cart || cart.length === 0) {
            showToast('Your cart is empty. Please add items before checking out.', 'warning');
            return;
        }
        closeModal('cartModal');
        openModal('checkoutModal');
        window.togglePaymentMethodUI();
    };

    // Helper to submit the order to backend API and sync state
    async function submitOrderToBackend(orderData, receiptFile) {
        let response;
        if (receiptFile) {
            const formData = new FormData();
            formData.append('receipt', receiptFile);
            Object.keys(orderData).forEach(key => {
                if (key === 'items' || key === 'charges') {
                    formData.append(key, JSON.stringify(orderData[key]));
                } else {
                    formData.append(key, orderData[key]);
                }
            });
            response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Order creation failed');
        }

        return await response.json();
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('checkoutSubmitBtn') || checkoutForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            const paymentMethod = document.getElementById('checkPaymentMethod').value;
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

            if (total <= 0) {
                showToast('Your cart total is ₦0. Please add items to proceed.', 'warning');
                return;
            }

            const customerName = document.getElementById('checkCustName').value.trim();
            const customerEmail = document.getElementById('checkCustEmail').value.trim();
            const customerPhone = document.getElementById('checkCustPhone').value.trim();
            const shippingAddress = document.getElementById('checkCustAddress').value.trim();
            const notes = document.getElementById('checkCustNote').value.trim();

            if (!customerEmail || !customerEmail.includes('@')) {
                showToast('Please provide a valid email address for your order receipt and Paystack verification.', 'warning');
                return;
            }

            const baseOrderData = {
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                paymentMethod,
                notes,
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.qty,
                    price: item.price
                })),
                totalAmount: total,
                platform: 'Web Store'
            };

            // --- PAYSTACK ONLINE PAYMENT FLOW ---
            if (paymentMethod === 'Paystack') {
                submitBtn.innerText = "Opening Paystack...";
                submitBtn.disabled = true;

                try {
                    await ensurePaystackLoaded();

                    const handler = PaystackPop.setup({
                        key: PAYSTACK_PUBLIC_KEY,
                        email: customerEmail,
                        amount: Math.round(total * 100), // In kobo
                        currency: 'NGN',
                        ref: 'SHAYORS_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
                        metadata: {
                            custom_fields: [
                                { display_name: "Customer Name", variable_name: "customer_name", value: customerName },
                                { display_name: "Phone Number", variable_name: "phone_number", value: customerPhone },
                                { display_name: "Shipping Address", variable_name: "shipping_address", value: shippingAddress }
                            ]
                        },
                        callback: function(response) {
                            (async () => {
                                submitBtn.innerText = "Securing Order...";
                                try {
                                    const orderData = {
                                        ...baseOrderData,
                                        paymentStatus: 'paid',
                                        paymentReference: response.reference,
                                        receiptInfo: `Paystack Verified - Ref: ${response.reference}`
                                    };

                                    const createdOrder = await submitOrderToBackend(orderData, null);

                                    // Update local sales records
                                    const sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                                    sales.push({
                                        ...orderData,
                                        id: createdOrder._id,
                                        date: new Date().toISOString(),
                                        status: 'Paid',
                                        amountPaid: total,
                                        type: 'product'
                                    });
                                    localStorage.setItem('shayorsSales', JSON.stringify(sales));

                                    // Open WhatsApp with confirmed order details
                                    const itemsList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
                                    const waMessage = `✅ New Paid Order via Paystack!\nCustomer: ${orderData.customerName}\nOrder ID: ${createdOrder._id}\nPaystack Ref: ${response.reference}\nItems: ${itemsList}\nTotal: ₦${total.toLocaleString()}\nAddress: ${orderData.shippingAddress}\nPhone: ${orderData.customerPhone}`;
                                    window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');

                                    showToast(`🎉 Payment Successful! Order #${createdOrder._id.slice(-6).toUpperCase()} confirmed. Receipt sent to your email.`, 'success', 6000);
                                    cart = [];
                                    saveCart();
                                    updateCartUI();
                                    closeModal('checkoutModal');
                                    checkoutForm.reset();
                                } catch (err) {
                                    console.error('Order saving error after payment:', err);
                                    showToast(`Payment recorded (Ref: ${response.reference}). Please reach out on WhatsApp if you need support.`, 'warning', 6000);
                                } finally {
                                    submitBtn.innerText = originalText;
                                    submitBtn.disabled = false;
                                }
                            })();
                        },
                        onClose: function() {
                            submitBtn.innerText = originalText;
                            submitBtn.disabled = false;
                            showToast('Payment window closed. Your order was not charged.', 'info');
                        }
                    });

                    handler.openIframe();
                } catch (err) {
                    console.error('Paystack initialization error:', err);
                    showToast(`Could not open Paystack payment window: ${err.message}`, 'error');
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
                return;
            }

            // --- MANUAL BANK TRANSFER FLOW ---
            const receiptLinkInput = document.getElementById('checkReceiptLink');
            const receiptFileInput = document.getElementById('checkReceiptFile');
            const receiptLink = receiptLinkInput ? receiptLinkInput.value.trim() : '';
            const receiptFile = receiptFileInput && receiptFileInput.files ? receiptFileInput.files[0] : null;

            if (!receiptLink && !receiptFile) {
                showToast('Please provide a payment receipt (Link or File) for Bank Transfer verification before completing your order.', 'warning');
                return;
            }

            submitBtn.innerText = "Processing Order...";
            submitBtn.disabled = true;

            try {
                const orderData = {
                    ...baseOrderData,
                    paymentStatus: 'unpaid',
                    receiptInfo: receiptLink || (receiptFile ? `File: ${receiptFile.name}` : 'N/A')
                };

                const createdOrder = await submitOrderToBackend(orderData, receiptFile);

                // Update Local Records
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

                // Open WhatsApp
                const itemsList = cart.map(item => `${item.name} (x${item.qty})`).join(', ');
                const waMessage = `New Order from ${orderData.customerName}:\nOrder ID: ${createdOrder._id}\nItems: ${itemsList}\nTotal: ₦${total.toLocaleString()}\nAddress: ${orderData.shippingAddress}\nPhone: ${orderData.customerPhone}\nPayment: ${orderData.paymentMethod}\nReceipt: ${orderData.receiptInfo}`;
                window.open(`https://wa.me/+2348189085285?text=${encodeURIComponent(waMessage)}`, '_blank');

                showToast('Order placed successfully! Opening WhatsApp for confirmation...', 'success', 5000);
                cart = [];
                saveCart();
                updateCartUI();
                closeModal('checkoutModal');
                checkoutForm.reset();
            } catch (error) {
                console.error('Order error:', error);
                showToast(`Order submission failed: ${error.message || 'Please check connection.'}`, 'error');
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
            showToast('Thank you for contacting Shayors Cosmetics. We will get back to you shortly!', 'success');
            contactForm.reset();
        });
    }
});
