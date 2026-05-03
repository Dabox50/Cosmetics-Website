document.addEventListener('DOMContentLoaded', () => {
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');

    // SET THIS TO FALSE to use your LOCAL server for testing
    const USE_LIVE_DATA_LOCALLY = false;

    const API_BASE = (isLocal && !USE_LIVE_DATA_LOCALLY)
        ? `http://${window.location.hostname}:5000/api` 
        : "https://cosmetics-website.fly.dev/api";

    // Helper to get token safely
    function getAdminToken() {
        // Check for both API token and local bypass token
        const token = sessionStorage.getItem('shayorsAdminToken') || localStorage.getItem('shayorsAdminToken') || localStorage.getItem('inventoryLoggedIn');
        if (!token || token === "undefined" || token === "null") {
            return null;
        }
        return token;
    }

    // Standardized fetch with 10s timeout
    async function fetchWithTimeout(resource, options = {}) {
        const { timeout = 10000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    function checkPermission(perm) {
        const loggedInStaffEmail = sessionStorage.getItem('shayorsStaffEmail') || localStorage.getItem('shayorsStaffEmail');
        const isMasterAdmin = sessionStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('inventoryLoggedIn') === 'true';

        // If it's the master admin, they have all permissions
        if (isMasterAdmin) return true;

        if (!loggedInStaffEmail) return false; 
        
        const currentStaff = staff.find(s => s.email === loggedInStaffEmail);
        if (!currentStaff) return false;
        
        if (currentStaff.role === 'Admin') return true; // Any staff with "Admin" role also has full access
        
        const currentRole = roles.find(r => r.name === currentStaff.role);
        if (!currentRole) return false;
        
        return currentRole.permissions.includes('all') || currentRole.permissions.includes(perm);
    }

    function enforcePermissions() {
        const sidebarItems = document.querySelectorAll('.sidebar-nav li');
        let firstAllowedModule = '';
        let currentModuleIsAllowed = false;
        const activeModule = document.querySelector('.module.active')?.id?.replace('-module', '');
        
        sidebarItems.forEach(item => {
            const module = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (!module) return;
            
            let isAllowed = false;
            switch(module) {
                case 'inventory': 
                    isAllowed = checkPermission('add_product') || checkPermission('edit_product') || checkPermission('delete_product'); 
                    break;
                case 'pos': 
                    isAllowed = checkPermission('view_inventory'); 
                    break;
                case 'orders': 
                    isAllowed = checkPermission('record_sale'); 
                    break;
                case 'sales': 
                    isAllowed = checkPermission('record_sale') || checkPermission('confirm_sales_payment') || checkPermission('edit_invoice_style') || checkPermission('view_records') || checkPermission('view_reports') || checkPermission('export_data') || checkPermission('delete_records'); 
                    break;
                case 'expenses': 
                    isAllowed = checkPermission('view_records'); 
                    break;
                case 'analytics': 
                    isAllowed = checkPermission('view_analytics') || checkPermission('view_reports'); 
                    break;
                case 'spa': 
                    isAllowed = checkPermission('Add_and_edit_spa'); 
                    break;
                case 'adjustments': 
                    isAllowed = checkPermission('manage_settings'); 
                    break;
                case 'customers': 
                    isAllowed = checkPermission('view_customers') || checkPermission('manage_customers'); 
                    break;
                case 'suppliers': 
                    isAllowed = checkPermission('manage_suppliers'); 
                    break;
                case 'store': 
                    isAllowed = checkPermission('manage_staff') || checkPermission('create_store_role') || checkPermission('add_store_staff') || checkPermission('remove_store_staff'); 
                    break;
            }
            
            if (isAllowed) {
                item.style.display = 'block';
                if (!firstAllowedModule) firstAllowedModule = module;
                if (module === activeModule) currentModuleIsAllowed = true;
            } else {
                item.style.display = 'none';
            }
        });

        // If current active module is not allowed, switch to the first allowed one
        if (!currentModuleIsAllowed && firstAllowedModule) {
            showModule(firstAllowedModule);
        }

        // --- MODULE SPECIFIC GATING ---

        // Inventory Module Gating
        const inventoryAddBtn = document.querySelector('#inventory-module button[onclick="toggleForm()"]');
        if (inventoryAddBtn) inventoryAddBtn.style.display = checkPermission('add_product') ? 'block' : 'none';
        
        const inventorySearchWrapper = document.querySelector('#inventory-module .search-wrapper');
        const hasInventoryAccess = checkPermission('add_product') || checkPermission('edit_product') || checkPermission('delete_product');
        if (inventorySearchWrapper) inventorySearchWrapper.style.display = hasInventoryAccess ? 'block' : 'none';

        // Inventory Table Columns (Image, Product Info)
        const inventoryTable = document.getElementById('inventoryTable');
        if (inventoryTable) {
            const hasInfoAccess = hasInventoryAccess; // As per user request: "add, edit and delete product should only give access to... search, InventoryTable Image and product info"
            // We handle this in renderInventory generally, but can hide headers here if needed
        }

        // Notification Bell Gating
        const notificationBell = document.querySelector('.notification-bell');
        if (notificationBell) {
            notificationBell.style.display = checkPermission('record_sale') ? 'flex' : 'none';
        }

        // Sales Module Gating
        const newSaleBtn = document.querySelector('#sales-module button[onclick="showNewSaleForm()"]');
        if (newSaleBtn) newSaleBtn.style.display = checkPermission('record_sale') ? 'block' : 'none';

        const salesHistoryTable = document.getElementById('salesHistoryTable');
        if (salesHistoryTable) {
            const hasSalesTableAccess = checkPermission('confirm_sales_payment') || checkPermission('record_sale') || checkPermission('edit_invoice_style') || checkPermission('view_records') || checkPermission('view_reports') || checkPermission('export_data') || checkPermission('delete_records');
            salesHistoryTable.closest('.table-container').style.display = hasSalesTableAccess ? 'block' : 'none';
        }

        // Analytics Module Gating
        const topMetrics = document.querySelector('.dashboard-summary-row.top-metrics');
        const bottomMetrics = document.querySelector('.dashboard-summary-row.bottom-metrics');
        const compMetrics = document.querySelector('.dashboard-summary-row.comparative-metrics');
        const hasAnalyticsSummaryAccess = checkPermission('view_weekly_sales_summary') || checkPermission('view_reports');
        
        if (topMetrics) topMetrics.style.display = (hasAnalyticsSummaryAccess || checkPermission('view_analytics')) ? '' : 'none';
        if (bottomMetrics) bottomMetrics.style.display = (hasAnalyticsSummaryAccess || checkPermission('view_analytics')) ? '' : 'none';
        if (compMetrics) compMetrics.style.display = (hasAnalyticsSummaryAccess || checkPermission('view_analytics')) ? '' : 'none';

        const dashboardMainContent = document.querySelector('#analytics-module .dashboard-main-content');
        if (dashboardMainContent) {
            dashboardMainContent.style.display = checkPermission('view_analytics') ? 'grid' : 'none';
        }

        // Customers Module Gating
        const addCustomerBtn = document.querySelector('#customers-module button[onclick="toggleCustomerForm()"]');
        if (addCustomerBtn) addCustomerBtn.style.display = checkPermission('manage_customers') ? 'block' : 'none';

        // Store Module Gating
        const storeManagementCards = document.querySelectorAll('#store-module .admin-card');
        storeManagementCards.forEach(card => {
            const h2 = card.querySelector('h2');
            const h3 = card.querySelector('h3');
            const title = (h2 || h3)?.innerText || '';
            
            if (title.includes('Role')) {
                card.style.display = checkPermission('create_store_role') ? 'block' : 'none';
            } else if (title.includes('Staff')) {
                const hasStaffAccess = checkPermission('manage_staff') || checkPermission('add_store_staff') || checkPermission('remove_store_staff');
                card.style.display = hasStaffAccess ? 'block' : 'none';
                
                // Gate "Resend All Invites" and "Add New Staff" buttons specifically
                const resendBtn = card.querySelector('button[onclick="resendAllPendingInvites()"]');
                const addStaffBtn = card.querySelector('button[onclick="toggleStaffForm()"]');
                
                if (resendBtn) resendBtn.style.display = checkPermission('manage_staff') ? 'block' : 'none';
                if (addStaffBtn) addStaffBtn.style.display = (checkPermission('manage_staff') || checkPermission('add_store_staff')) ? 'block' : 'none';
            }
        });

        // Update status bar
        const statusContainer = document.getElementById('adminStatusContainer');
        if (statusContainer) {
            const loggedInStaffEmail = sessionStorage.getItem('shayorsStaffEmail') || localStorage.getItem('shayorsStaffEmail');
            const isMasterAdmin = sessionStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('inventoryLoggedIn') === 'true';
            
            let statusHTML = '';
            if (isMasterAdmin) {
                statusHTML = `<span>👨‍💻 Admin Logged In</span>`;
            } else if (loggedInStaffEmail) {
                const currentStaff = staff.find(s => s.email === loggedInStaffEmail);
                const roleName = currentStaff ? currentStaff.role : 'Staff';
                statusHTML = `<span>🧑‍💼 ${roleName} (${loggedInStaffEmail})</span>`;
            }
            statusHTML += `<button class="logout-btn" onclick="logoutAdmin()">Logout</button>`;
            statusContainer.innerHTML = statusHTML;
        }

        // FINALLY reveal the app wrapper once permissions are set
        document.getElementById('adminAppWrapper')?.classList.remove('auth-hidden');
    }

    // reconciliation between API and localStorage
    async function syncSalesWithAPI() {
        const token = getAdminToken();
        if (!token) return false;

        // Get deleted IDs to avoid re-syncing them
        const deletedIds = JSON.parse(localStorage.getItem('shayorsDeletedSalesIds')) || [];

        try {
            const [ordersRes, bookingsRes, salesRes] = await Promise.all([
                fetchWithTimeout(`${API_BASE}/orders?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetchWithTimeout(`${API_BASE}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetchWithTimeout(`${API_BASE}/sales`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            let localSales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
            let modified = false;

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                const apiOrders = data.orders || [];
                
                apiOrders.forEach(order => {
                    if (deletedIds.includes(order._id)) return; // SKIP DELETED

                    const exists = localSales.find(s => s.apiId === order._id || s.id === order._id);
                    const newStatus = order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus === 'partly paid' ? 'Partly Paid' : 'Unpaid');
                    
                    if (!exists) {
                        localSales.push({
                            id: order._id,
                            apiId: order._id,
                            date: order.createdAt,
                            customer: order.customerName,
                            contact: order.customerPhone,
                            items: order.items.map(i => ({
                                name: i.productName,
                                description: i.description || '',
                                qty: i.quantity,
                                price: i.price,
                                total: i.quantity * i.price
                            })),
                            total: order.totalAmount,
                            status: newStatus,
                            paymentMethod: order.paymentMethod,
                            amountPaid: order.paymentStatus === 'paid' ? order.totalAmount : 0,
                            platform: order.platform || 'Web Store',
                            type: 'product'
                        });
                        modified = true;
                    } else if (exists.status !== newStatus) {
                        exists.status = newStatus;
                        if (order.paymentStatus === 'paid') exists.amountPaid = order.totalAmount;
                        modified = true;
                    }
                });
            }
            
            if (bookingsRes.ok) {
                const apiBookings = await bookingsRes.json();
                apiBookings.forEach(booking => {
                    if (deletedIds.includes(booking._id)) return; // SKIP DELETED

                    const exists = localSales.find(s => s.apiId === booking._id || s.id === booking._id);
                    if (!exists) {
                        localSales.push({
                            id: booking._id,
                            apiId: booking._id,
                            date: booking.createdAt,
                            customer: booking.customerName,
                            contact: booking.customerContact,
                            items: [{ name: booking.serviceName, qty: 1, price: booking.totalAmount || booking.price || 0, type: 'spa' }], 
                            total: booking.totalAmount || booking.price || 0, 
                            status: 'Paid',
                            platform: 'WhatsApp',
                            type: 'spa'
                        });
                        modified = true;
                    }
                });
            }

            if (salesRes.ok) {
                const apiSales = await salesRes.json();
                apiSales.forEach(sale => {
                    if (deletedIds.includes(sale._id)) return; // SKIP DELETED

                    const exists = localSales.find(s => s.apiId === sale._id || s.id === sale._id);
                    if (!exists) {
                        localSales.push({
                            id: sale._id,
                            apiId: sale._id,
                            date: sale.createdAt || sale.saleDate,
                            customer: sale.customerName || 'Walk-in',
                            contact: sale.customerContact || '',
                            items: sale.items.map(i => ({
                                name: i.name,
                                qty: i.quantity,
                                price: i.price,
                                total: i.total
                            })),
                            total: sale.totalAmount,
                            status: 'Paid',
                            paymentMethod: sale.paymentMethod,
                            amountPaid: sale.amountPaid || sale.totalAmount,
                            platform: sale.platform || 'POS',
                            type: 'product'
                        });
                        modified = true;
                    }
                });
            }

            if (modified) {
                // Sort by date descending
                localSales.sort((a, b) => new Date(b.date) - new Date(a.date));
                localStorage.setItem('shayorsSales', JSON.stringify(localSales));
            }
            sales = localSales;
            return modified;
        } catch (error) {
            console.error("Sync Sales Error:", error);
            return false;
        }
    }

    async function syncCustomersWithAPI() {
        const token = getAdminToken();
        if (!token) return;

        let localCustomers = JSON.parse(localStorage.getItem('shayorsCustomers')) || [];
        if (localCustomers.length === 0) return;

        try {
            await Promise.all(localCustomers.map(cust => {
                const c = { ...cust };
                delete c.id; // Let MongoDB generate ID
                return fetch(`${API_BASE}/customers`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(c)
                });
            }));
            // Clear local storage to avoid double sync
            localStorage.removeItem('shayorsCustomers');
            console.log("Local customers synced to API");
        } catch (error) {
            console.error("Sync Customers Error:", error);
        }
    }

    async function syncAdjustmentsWithAPI() {
        const token = getAdminToken();
        if (!token) return;

        let localAdjustments = JSON.parse(localStorage.getItem('shayorsAdjustments')) || [];
        if (localAdjustments.length === 0) return;

        try {
            await Promise.all(localAdjustments.map(adj => {
                const a = { ...adj };
                delete a.id;
                return fetch(`${API_BASE}/adjustments`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(a)
                });
            }));
            localStorage.removeItem('shayorsAdjustments');
            console.log("Local adjustments synced to API");
        } catch (error) {
            console.error("Sync Adjustments Error:", error);
        }
    }

    // --- POS MODULE LOGIC ---
    const posSearchInput = document.getElementById('posBarcodeSearch');
    if (posSearchInput) {
        posSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const val = this.value.trim();
                if (val) addToCartByBarcode(val);
                this.value = '';
            }
        });

        posSearchInput.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            const resultsDiv = document.getElementById('posSearchResults');
            if (term.length < 2) {
                resultsDiv.classList.add('hidden');
                return;
            }

            const matches = inventory.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.barcode && p.barcode.toLowerCase().includes(term))
            ).slice(0, 5);

            if (matches.length > 0) {
                resultsDiv.innerHTML = matches.map(p => `
                    <div class="search-item" onclick="addIdToCart('${p._id}')">
                        <span>${p.name}</span>
                        <span>₦${p.price.toLocaleString()}</span>
                    </div>
                `).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.classList.add('hidden');
            }
        });
    }

    // --- SALES PRODUCT SEARCH LOGIC ---
    const saleProductSearch = document.getElementById('saleProductSearch');
    const saleDiscountInput = document.getElementById('saleDiscount');
    
    if (saleDiscountInput) {
        saleDiscountInput.addEventListener('input', updateSaleTotal);
    }

    if (saleProductSearch) {
        saleProductSearch.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            const resultsDiv = document.getElementById('saleProductResults');
            if (term.length < 2) {
                resultsDiv.classList.add('hidden');
                return;
            }

            // Filter and sort alphabetically
            const matches = inventory
                .filter(p => p.name.toLowerCase().includes(term))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (matches.length > 0) {
                resultsDiv.innerHTML = matches.map(p => `
                    <div class="search-item" onclick="selectSaleProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: bold;">${p.name}</span>
                            <span style="font-size: 0.8rem; color: #666;">₦${p.price.toLocaleString()}</span>
                        </div>
                        <span style="font-size: 0.85rem; color: ${p.stock <= 5 ? 'var(--out-of-stock)' : 'var(--in-stock)'};">
                            ${p.stock} left
                        </span>
                    </div>
                `).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.classList.add('hidden');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const resultsDiv = document.getElementById('saleProductResults');
            if (resultsDiv && !saleProductSearch.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.classList.add('hidden');
            }
        });
    }

    window.selectSaleProduct = function(id, name) {
        document.getElementById('saleProduct').value = id;
        document.getElementById('saleProductSearch').value = name;
        document.getElementById('saleProductResults').classList.add('hidden');
        updateSalePrice(); // Re-use existing function
    };

    async function addToCartByBarcode(barcode) {
        // Find product in LOCAL inventory (products added to your store)
        const product = inventory.find(p => p.barcode === barcode);
        
        if (product) {
            addProductToPOSCart(product);
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            // If not in memory, try the store's API (still limited to YOUR store)
            const token = getAdminToken();
            try {
                const res = await fetch(`${API_BASE}/products/barcode/${barcode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const apiProd = await res.json();
                    addProductToPOSCart(apiProd);
                    if (navigator.vibrate) navigator.vibrate(50);
                } else {
                    alert(`Product not found in store inventory: ${barcode}`);
                }
            } catch (err) { 
                console.error("Barcode fetch error", err);
                alert("Error searching for product in store.");
            }
        }
    }

    window.addIdToCart = function(id) {
        const product = inventory.find(p => p._id === id);
        if (product) {
            addProductToPOSCart(product);
            document.getElementById('posSearchResults').classList.add('hidden');
            document.getElementById('posBarcodeSearch').value = '';
        }
    }

    function addProductToPOSCart(product) {
        const existing = posCart.find(item => item.product === product._id);
        if (existing) {
            if (existing.quantity + 1 > product.stock) {
                alert("Cannot add more. Insufficient stock!");
                return;
            }
            existing.quantity++;
            existing.total = existing.quantity * existing.price;
        } else {
            if (product.stock < 1) {
                alert("Product out of stock!");
                return;
            }
            posCart.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price,
                stock: product.stock
            });
        }
        renderPOSCart();
    }

    function renderPOSCart() {
        const body = document.getElementById('posCartBody');
        if (!body) return;
        body.innerHTML = '';

        posCart.forEach((item, index) => {
            body.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>₦${item.price.toLocaleString()}</td>
                    <td>
                        <div class="qty-controls">
                            <button onclick="updateCartQty(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQty(${index}, 1)">+</button>
                        </div>
                    </td>
                    <td>₦${item.total.toLocaleString()}</td>
                    <td><button class="btn-text danger" onclick="removeFromCart(${index})">Remove</button></td>
                </tr>
            `;
        });

        calculatePOSTotals();
    }

    // --- POS CALCULATION LOGIC ---
    window.calculatePOSTotals = function() {
        let subtotal = posCart.reduce((sum, item) => sum + item.total, 0);
        let totalItems = posCart.reduce((sum, item) => sum + item.quantity, 0);

        // Discount Calculation
        let discountVal = parseFloat(document.getElementById('posDiscount').value) || 0;
        let discountType = document.getElementById('posDiscountType').value;
        let discountAmount = discountType === 'percent' ? (subtotal * discountVal / 100) : discountVal;

        // Tax Calculation
        let taxVal = parseFloat(document.getElementById('posTax').value) || 0;
        let taxType = document.getElementById('posTaxType').value;
        let taxAmount = taxType === 'percent' ? ((subtotal - discountAmount) * taxVal / 100) : taxVal;

        // Grand Total
        let grandTotal = subtotal - discountAmount + taxAmount;
        if (grandTotal < 0) grandTotal = 0;

        // Balance/Change
        let amountPaid = parseFloat(document.getElementById('posAmountPaid').value) || 0;
        let balance = amountPaid - grandTotal;

        // Update UI
        document.getElementById('posTotalItems').innerText = totalItems;
        document.getElementById('posSubtotal').innerText = `₦${subtotal.toLocaleString()}`;
        document.getElementById('posGrandTotal').innerText = `₦${grandTotal.toLocaleString()}`;
        document.getElementById('posBalance').innerText = `₦${Math.abs(balance).toLocaleString()}`;
        
        const balanceLabel = document.querySelector('#balanceDisplayContainer span');
        if (balanceLabel) {
            balanceLabel.innerText = balance >= 0 ? 'Change:' : 'Balance Due:';
        }
    };

    window.setQuickAmount = function(amount) {
        // Remove active class from all quick buttons
        document.querySelectorAll('.btn-quick').forEach(btn => btn.classList.remove('active'));
        
        const amountPaidInput = document.getElementById('posAmountPaid');
        const grandTotalStr = document.getElementById('posGrandTotal').innerText.replace('₦', '').replace(/,/g, '');
        const grandTotal = parseFloat(grandTotalStr) || 0;

        if (amount === 'exact') {
            amountPaidInput.value = grandTotal.toFixed(2);
            event.target.classList.add('active');
        } else {
            amountPaidInput.value = amount.toFixed(2);
            event.target.classList.add('active');
        }
        calculatePOSTotals();
    };

    window.keypadInput = function(val) {
        const input = document.getElementById('posAmountPaid');
        let current = input.value;

        if (val === 'clear') {
            input.value = '0';
        } else if (val === 'backspace') {
            input.value = current.length > 1 ? current.slice(0, -1) : '0';
        } else if (val === '.') {
            if (!current.includes('.')) input.value = current + '.';
        } else {
            // If current is '0', replace it unless it's a decimal
            if (current === '0') {
                input.value = val;
            } else {
                input.value = current + val;
            }
        }
        calculatePOSTotals();
    };

    window.updateCartQty = function(index, delta) {
        const item = posCart[index];
        if (item.quantity + delta > item.stock) {
            alert("Insufficient stock!");
            return;
        }
        item.quantity += delta;
        if (item.quantity <= 0) {
            posCart.splice(index, 1);
        } else {
            item.total = item.quantity * item.price;
        }
        renderPOSCart();
    };

    window.removeFromCart = function(index) {
        posCart.splice(index, 1);
        renderPOSCart();
    };

    window.clearPOSCart = function() {
        if (confirm("Clear current cart?")) {
            posCart = [];
            renderPOSCart();
        }
    };

    window.checkoutPOS = async function() {
        if (posCart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        const paymentMethod = document.getElementById('posPaymentMethod').value;
        const customerName = document.getElementById('posCustomerName').value;
        const customerContact = document.getElementById('posCustomerContact').value;

        // Current totals from calculation logic
        const subtotal = posCart.reduce((sum, item) => sum + item.total, 0);
        const grandTotalStr = document.getElementById('posGrandTotal').innerText.replace('₦', '').replace(/,/g, '');
        const totalAmount = parseFloat(grandTotalStr) || 0;
        const totalItems = posCart.reduce((sum, item) => sum + item.quantity, 0);

        const amountPaid = parseFloat(document.getElementById('posAmountPaid').value) || 0;

        // Validation for cash payments
        if (paymentMethod === 'Cash' && amountPaid < totalAmount) {
            if (!confirm(`Amount paid (₦${amountPaid}) is less than Total (₦${totalAmount}). Proceed as partial payment?`)) {
                return;
            }
        }

        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: posCart,
                    totalAmount,
                    totalItems,
                    paymentMethod,
                    customerName,
                    customerContact,
                    amountPaid,
                    subtotal // Optional: track subtotal
                })
            });

            if (res.ok) {
                const saleData = await res.json();
                alert("Sale completed successfully!");
                showReceipt(saleData);
                
                // Add to local sales history with consistent ID mapping
                const mappedSale = {
                    ...saleData,
                    id: saleData._id || saleData.id,
                    apiId: saleData._id || saleData.id,
                    date: saleData.createdAt || new Date().toISOString(),
                    customer: saleData.customerName || 'Walk-in',
                    total: saleData.totalAmount || totalAmount, // Ensure total is set
                    type: 'product'
                };
                sales.push(mappedSale);
                localStorage.setItem('shayorsSales', JSON.stringify(sales));
                
                // Reset POS
                posCart = [];
                document.getElementById('posDiscount').value = '0';
                document.getElementById('posTax').value = '0';
                document.getElementById('posAmountPaid').value = '0';
                renderPOSCart();
                fetchInventory(); // Refresh stock in UI
                renderRecentPosTransactions();
                renderSalesHistory();
            } else {
                const err = await res.json();
                alert("Checkout failed: " + err.message);
            }
        } catch (err) {
            console.error("POS Checkout error", err);
            alert("An error occurred during checkout.");
        }
    };

    window.resetPOSHistory = function() {
        if (!confirm("Are you sure you want to clear the recent POS transaction history? This only clears the local view display.")) return;
        
        // If the user meant to delete from server too, they should use the Sales history 'Del' button.
        // But usually 'reset history' in POS view is just to clear the display list.
        // However, if we want to actually clear the data, we'd need to know if we're clearing EVERYTHING or just POS.
        // For now, let's just clear the local 'sales' array and re-render.
        // NOTE: This will also clear the Sales & Records history since they share the 'sales' array.
        
        if (confirm("This will also clear the Sales Record history. Proceed?")) {
            sales = [];
            localStorage.setItem('shayorsSales', JSON.stringify(sales));
            renderRecentPosTransactions();
            renderSalesHistory();
            if (typeof renderAnalytics === 'function') renderAnalytics();
        }
    };

    window.showReceipt = function(sale) {
        if (!sale) return;
        const dateStr = sale.createdAt || sale.date;
        document.getElementById('receiptDate').innerText = dateStr ? new Date(dateStr).toLocaleString() : '---';
        const receiptId = (sale._id || sale.apiId || sale.id || '').toString();
        document.getElementById('receiptNumber').innerText = receiptId ? receiptId.slice(-6).toUpperCase() : '---';
        
        const itemsBody = document.getElementById('receiptItemsBody');
        const itemsList = Array.isArray(sale.items) ? sale.items : [];
        itemsBody.innerHTML = itemsList.map(item => `
            <tr>
                <td>${item.name || item.productName || 'Unknown Product'}</td>
                <td>${item.quantity || item.qty || 1}</td>
                <td>₦${(item.price || 0).toLocaleString()}</td>
                <td>₦${(item.total || ((item.price || 0) * (item.quantity || item.qty || 0)) || 0).toLocaleString()}</td>
            </tr>
        `).join('');

        document.getElementById('receiptTotal').innerText = `₦${(sale.totalAmount || sale.total || 0).toLocaleString()}`;
        document.getElementById('receiptPayment').innerText = sale.paymentMethod || 'Cash';

        document.getElementById('receiptModal').classList.remove('hidden');
    };

    window.closeReceiptModal = function() {
        document.getElementById('receiptModal').classList.add('hidden');
    };

    // Close modal when clicking outside content
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        receiptModal.addEventListener('click', function(e) {
            if (e.target === this) window.closeReceiptModal();
        });
    }

    window.printReceipt = function() {
        const printContent = document.getElementById('receiptPrintArea').innerHTML;
        const originalContent = document.body.innerHTML;
        
        // Use a hidden iframe or new window for cleaner printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; min-width: auto; width: 300px; margin: 0 auto; padding: 10px; box-sizing: border-box; }
                        h2 { text-align: center; margin-bottom: 5px; }
                        p { margin: 2px 0; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
                        th { text-align: left; border-bottom: 1px solid #000; font-size: 14px; }
                        td { padding: 5px 0; font-size: 14px; }
                        th:nth-child(2), th:nth-child(3), th:nth-child(4),
                        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: center; }
                        .receipt-summary { margin-top: 10px; text-align: right; }
                        .receipt-footer { margin-top: 20px; text-align: center; font-style: italic; }
                        hr { border: none; border-top: 1px dashed #000; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // 0. Admin Authentication
    async function init() {
        let token = getAdminToken();

        // Handle URL tokens for Invitations or Password Resets
        const urlParams = new URLSearchParams(window.location.search);
        const inviteToken = urlParams.get('inviteToken');
        const resetToken = urlParams.get('resetToken');

        // If we have an invite/reset token AND no active session, show the modal
        if (inviteToken && !token) {
            showAcceptInviteModal(inviteToken);
            return;
        }
        if (resetToken && !token) {
            showResetPasswordModal(resetToken);
            return;
        }
        
        if (!token) {
            toggleAuthVisibility(false);
            showLoginModal();
        } else {
            toggleAuthVisibility(true);
            
            // Sync staff and roles data FIRST so enforcePermissions has the right info
            await Promise.all([
                fetchStaff(),
                fetchRoles()
            ]);
            enforcePermissions(); 
            
            const [syncModified] = await Promise.all([
                syncSalesWithAPI(),
                fetchInventory(),
                fetchSpaCategories(),
                fetchExpenseCategories(),
                (async () => {
                    await syncCustomersWithAPI();
                    await fetchCustomers();
                })(),
                (async () => {
                    await syncAdjustmentsWithAPI();
                    await fetchAdjustments();
                })()
            ]);
            enforcePermissions();

            // Request permission for system notifications
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            
            // Re-render if sync changed anything
            if (syncModified) {
                renderRecentPosTransactions();
                // Also update sales history if it's the active module
                const activeModule = document.querySelector('.module.active');
                if (activeModule && activeModule.id === 'sales-module') {
                    renderSalesHistory();
                }
            } else {
                renderRecentPosTransactions();
            }
        }
    }

    function toggleAuthVisibility(isLoggedIn) {
        const appWrapper = document.getElementById('adminAppWrapper');
        const brandsBar = document.getElementById('adminBrandsBar');
        const statusContainer = document.getElementById('adminStatusContainer');
        const loginContainer = document.getElementById('loginModalContainer');

        if (isLoggedIn) {
            // We don't remove auth-hidden immediately from appWrapper 
            // to prevent flickering before permissions are enforced
            brandsBar?.classList.remove('auth-hidden');
            statusContainer?.classList.remove('auth-hidden');
            if (loginContainer) loginContainer.innerHTML = '';
        } else {
            appWrapper?.classList.add('auth-hidden');
            brandsBar?.classList.add('auth-hidden');
            statusContainer?.classList.add('auth-hidden');
        }
    }

    function showLoginModal() {
        const container = document.getElementById('loginModalContainer');
        if (!container) return;

        container.innerHTML = `
            <div id="loginModal" class="modal">
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <img src="../Image/Shayor's Cosmetics .png" width="150" style="margin-bottom: 20px;">
                    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Inventory Login</h2>
                    
                    <form id="loginForm">
                        <input type="email" id="loginEmail" placeholder="Email Address" required 
                               style="width: 100%; padding: 12px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        <input type="password" id="loginPass" placeholder="Password" required 
                               style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        
                        <div style="text-align: left; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="rememberMe" style="width: 16px; height: 16px; cursor: pointer;">
                                <label for="rememberMe" style="font-size: 0.85rem; color: #555; cursor: pointer;">Remember Me</label>
                            </div>
                            <a href="#" onclick="showForgotPasswordModal(); return false;" style="font-size: 0.85rem; color: var(--primary-color); text-decoration: none;">Forgot Password?</a>
                        </div>
                        
                        <button type="submit" class="btn primary" style="width: 100%; padding: 12px; border-radius: 5px;">Login to Dashboard</button>
                    </form>
                    <p style="margin-top: 20px;"><a href="../index.html" style="color: #888; text-decoration: none; font-size: 0.85rem;">← Back to Home</a></p>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPass').value;
            const remember = document.getElementById('rememberMe').checked;

            try {
                const response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('shayorsAdminToken', data.token);
                    sessionStorage.setItem('shayorsStaffEmail', data.email);
                    sessionStorage.setItem('shayorsIsAdmin', !data.isStaff);
                    if (remember) {
                        localStorage.setItem('shayorsAdminToken', data.token);
                        localStorage.setItem('shayorsStaffEmail', data.email);
                        localStorage.setItem('shayorsIsAdmin', !data.isStaff);
                        if (!data.isStaff) localStorage.setItem('inventoryLoggedIn', 'true');
                    }
                    toggleAuthVisibility(true);
                    await init(); // Apply permissions and load data
                } else {
                    alert(data.message || "Login failed. Please check your credentials.");
                }
            } catch (error) {
                console.error("Login failed:", error);
                alert("Connection error. Is the server running?");
            }
        });
    }

    window.showForgotPasswordModal = function() {
        const container = document.getElementById('loginModalContainer');
        container.innerHTML = `
            <div class="modal">
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <h2 style="margin-bottom: 10px;">Forgot Password</h2>
                    <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">Enter your Gmail to receive a reset link</p>
                    <form id="forgotPassForm">
                        <input type="email" id="resetEmail" placeholder="Your Gmail Address" required 
                               style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <button type="submit" class="btn primary" style="width: 100%; padding: 12px;">Send Reset Link</button>
                        <button type="button" class="btn secondary" onclick="showLoginModal()" style="width: 100%; padding: 12px; margin-top: 10px;">Back to Login</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('forgotPassForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            try {
                const res = await fetch(`${API_BASE}/admin/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                alert(data.message);
                if (res.ok) showLoginModal();
            } catch (err) { alert("Failed to send reset link."); }
        });
    };

    window.showResetPasswordModal = function(token) {
        const container = document.getElementById('loginModalContainer');
        container.innerHTML = `
            <div class="modal">
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <h2>Set New Password</h2>
                    <form id="resetPassForm">
                        <input type="password" id="newPass" placeholder="Enter New Password" required 
                               style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; border-radius: 5px;">
                        <button type="submit" class="btn primary" style="width: 100%; padding: 12px;">Update Password</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('resetPassForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('newPass').value;
            try {
                const res = await fetch(`${API_BASE}/admin/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });
                const data = await res.json();
                alert(data.message);
                if (res.ok) {
                    // Clear reset token from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    showLoginModal();
                }
            } catch (err) { alert("Reset failed."); }
        });
    };

    window.showAcceptInviteModal = function(token) {
        const container = document.getElementById('loginModalContainer');
        container.innerHTML = `
            <div class="modal">
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <h2>Accept Staff Invitation</h2>
                    <p style="margin-bottom: 15px;">Please set your password to join the team</p>
                    <form id="acceptInviteForm">
                        <input type="password" id="staffPass" placeholder="Choose a Password" required 
                               style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <button type="submit" class="btn primary" style="width: 100%; padding: 12px;">Activate Account</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('acceptInviteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('staffPass').value;
            try {
                const res = await fetch(`${API_BASE}/admin/accept-invite`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });
                const data = await res.json();
                alert(data.message);
                if (res.ok) {
                    // Clear the invitation token from URL so it doesn't pop up again
                    window.history.replaceState({}, document.title, window.location.pathname);
                    showLoginModal();
                }
            } catch (err) { alert("Activation failed."); }
        });
    };

    window.logoutAdmin = function() {
        if (confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem('shayorsAdminToken');
            sessionStorage.removeItem('shayorsStaffEmail');
            sessionStorage.removeItem('shayorsIsAdmin');
            localStorage.removeItem('shayorsAdminToken');
            localStorage.removeItem('shayorsStaffEmail');
            localStorage.removeItem('shayorsIsAdmin');
            localStorage.removeItem('inventoryLoggedIn');
            window.location.reload();
        }
    };

    // 1. Core Data Structures
    let inventory = [];
    let sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
    let expenses = JSON.parse(localStorage.getItem('shayorsExpenses')) || [];
    let customers = JSON.parse(localStorage.getItem('shayorsCustomers')) || [];
    let suppliers = JSON.parse(localStorage.getItem('shayorsSuppliers')) || [];
    let staff = JSON.parse(localStorage.getItem('shayorsStaff')) || [];
    const initialRoles = [
        { name: 'Admin', permissions: ['all'] },
        { name: 'Sales Boy', permissions: ['pos_checkout', 'view_inventory', 'record_sale'] },
        { name: 'Store Manager', permissions: ['view_inventory', 'add_product', 'view_records', 'record_sale', 'manage_suppliers', 'view_reports', 'view_customers', 'manage_customers'] }
    ];
    let roles = JSON.parse(localStorage.getItem('shayorsRoles')) || initialRoles;
    let adjustments = JSON.parse(localStorage.getItem('shayorsAdjustments')) || [];
    let spaServices = JSON.parse(localStorage.getItem('shayorsSpaServices')) || [];
    let costAnalysis = JSON.parse(localStorage.getItem('shayorsCostAnalysis')) || [];
    const initialSpaCategories = [{ name: "Salon & Beauty", _id: "spa1" }, { name: "Spa and Wellness", _id: "spa2" }, { name: "Massage", _id: "spa3" }];
    let spaCategories = JSON.parse(localStorage.getItem('shayorsSpaCategories')) || initialSpaCategories;
    const initialCategoriesList = ["Scrub", "Black soap", "Lotion", "Tube", "Oil", "Serum", "Bar soap", "Cleanser", "Toner", "Perfume oil", "Airfreshner", "Gift box", "Tea", "Facesoap", "Body spray", "Roll on", "Lubricant", "Sponge", "Haircare", "Aphrodisiacs", "Cotton pad", "Wipes"];
    let categories = JSON.parse(localStorage.getItem('shayorsCategories')) || initialCategoriesList.map(name => ({ name, _id: 'local_' + Math.random().toString(36).substr(2, 9) }));
    
    const initialExpenseCategories = ["Rent", "Salaries", "Raw Materials", "Utility", "Logistics", "Advertising", "Maintenance", "Tax", "Other"];
    let expenseCategories = JSON.parse(localStorage.getItem('shayorsExpenseCategories')) || initialExpenseCategories.map(name => ({ name, _id: 'local_' + Math.random().toString(36).substr(2, 9) }));

    let currentOrders = [];
    let currentSaleItems = [];
    let currentCharges = [];

    window.setChargeType = function(type, btn) {
        document.getElementById('chargeType').value = type;
        const container = btn.closest('.charge-type-toggle');
        container.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSaleTotal();
    };

    window.setAutomation = function(type, btn) {
        document.getElementById('chargeAutomation').value = type;
        const container = btn.closest('.automation-toggle');
        container.querySelectorAll('.auto-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    window.addChargeToList = function() {
        const name = document.getElementById('chargeName').value.trim();
        const value = parseFloat(document.getElementById('chargeValue').value) || 0;
        const type = document.getElementById('chargeType').value;
        const isProfit = document.getElementById('chargeIsProfit').checked;
        const isHidden = document.getElementById('chargeIsHidden').checked;
        const automation = document.getElementById('chargeAutomation').value;
        const scope = document.querySelector('input[name="chargeScope"]:checked').value;

        if (!name) return alert('Enter charge name');
        if (value <= 0) return alert('Enter valid charge value');

        const charge = {
            id: Date.now(),
            name,
            value,
            type,
            isProfit,
            isHidden,
            automation,
            scope
        };

        currentCharges.push(charge);
        renderCharges();
        
        // Reset inputs
        document.getElementById('chargeName').value = '';
        document.getElementById('chargeValue').value = 0;
        document.getElementById('chargeIsProfit').checked = false;
        document.getElementById('chargeIsHidden').checked = false;
        // Keep automation and scope as default
    };

    window.removeCharge = function(id) {
        currentCharges = currentCharges.filter(c => c.id !== id);
        renderCharges();
    };

    function renderCharges() {
        const list = document.getElementById('appliedChargesList');
        if (!list) return;

        list.innerHTML = currentCharges.map(c => `
            <div class="charge-pill">
                <span>${c.name}: ${c.type === 'fixed' ? '₦' : ''}${c.value}${c.type === 'percent' ? '%' : ''}</span>
                <span class="remove-charge" onclick="removeCharge(${c.id})">&times;</span>
            </div>
        `).join('');
        
        updateSaleTotal(); // Make sure total updates
    }
    let lastPendingCount = 0;

    // POS State
    let posCart = [];

    // Helper to play notification beep
    function playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2); // 200ms beep

            // Trigger System Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("🛍️ New Order Received!", {
                    body: "A new order has arrived. Check the dashboard for details.",
                    icon: "../Image/Shayor's Logo.png"
                });
            }
        } catch (err) {
            console.error("Audio/Notification failed:", err);
        }
    }

    // --- WEB ORDERS MODULE ---
    window.fetchOrders = async function() {
        const status = document.getElementById('orderStatusFilter').value;
        const token = getAdminToken();
        try {
            const res = await fetchWithTimeout(`${API_BASE}/orders?status=${status}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                currentOrders = data.orders || [];
                renderOrders();
                
                // Update lastPendingCount based on what we just fetched
                const pendingNow = currentOrders.filter(o => o.orderStatus === 'pending').length;
                lastPendingCount = pendingNow;
                
                updateNewOrderBadge(); 
            }
        } catch (err) {
            console.error("Order fetch failed:", err);
        }
    };

    async function updateNewOrderBadge() {
        const token = getAdminToken();
        if (!token) return;
        try {
            const res = await fetchWithTimeout(`${API_BASE}/orders?status=pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const pendingCount = (data.orders || []).length;
                
                // Play sound if count increased
                if (pendingCount > lastPendingCount) {
                    playNotificationSound();
                }
                lastPendingCount = pendingCount;

                const badge = document.getElementById('newOrderBadge');
                if (badge) {
                    if (pendingCount > 0) {
                        badge.innerText = pendingCount;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        } catch (err) { console.error("Badge update failed:", err); }
    }

    // Poll for new orders every 30 seconds
    setInterval(updateNewOrderBadge, 30000);
    setTimeout(updateNewOrderBadge, 5000); // Initial check after 5s

    function renderOrders(filterData = currentOrders) {
        const body = document.getElementById('ordersBody');
        if (!body) return;
        body.innerHTML = '';

        filterData.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const items = order.items.map(i => `${i.productName} (x${i.quantity})`).join('<br>');
            
            const pStatus = order.paymentStatus || 'unpaid';
            const pStatusClass = pStatus === 'paid' ? 'status-paid' : 'status-unpaid';

            body.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td><strong>${order.customerName}</strong><br><small>${order.customerPhone}</small></td>
                    <td>${items}</td>
                    <td>₦${order.totalAmount.toLocaleString()}</td>
                    <td>
                        <select onchange="updateWebPaymentStatus('${order._id}', this.value)" class="status-select ${pStatusClass}">
                            <option value="paid" ${pStatus === 'paid' ? 'selected' : ''}>Paid</option>
                            <option value="unpaid" ${pStatus === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                            <option value="partly paid" ${pStatus === 'partly paid' ? 'selected' : ''}>Partly Paid</option>
                            <option value="pending" ${pStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        </select>
                    </td>
                    <td>
                        <select onchange="updateOrderStatus('${order._id}', this.value)" class="status-select">
                            <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn secondary" onclick="viewOrderDetails('${order._id}')">View</button>
                    </td>
                </tr>
            `;
        });
    }

    window.updateOrderStatus = async function(id, status) {
        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderStatus: status })
            });
            if (res.ok) {
                alert('Order status updated!');

                if (status === 'confirmed') {
                    const order = currentOrders.find(o => o._id === id);
                    if (order) {
                        await removeDebtorByOrderInfo(order.customerName, id, 'Web Store');
                    }
                }

                fetchOrders();
            }
        } catch (err) {
            console.error("Status update failed:", err);
        }
    };

    window.updateWebPaymentStatus = async function(id, status) {
        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentStatus: status })
            });
            if (res.ok) {
                alert('Payment status updated!');

                if (status === 'paid') {
                    const order = currentOrders.find(o => o._id === id);
                    if (order) {
                        await removeDebtorByOrderInfo(order.customerName, id, 'Web Store');
                    }
                }

                // Update local sales too if it exists there
                const sale = sales.find(s => s.apiId === id || s.id === id);
                if (sale) {
                    sale.status = status.charAt(0).toUpperCase() + status.slice(1);
                    if (status === 'paid') sale.amountPaid = sale.total;
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));
                    renderSalesHistory();
                }
                fetchOrders();
            }
        } catch (err) {
            console.error("Payment status update failed:", err);
        }
    };

    window.searchOrders = function() {
        const term = document.getElementById('orderSearch').value.toLowerCase();
        const filtered = currentOrders.filter(o => 
            o.customerName.toLowerCase().includes(term) || 
            o._id.includes(term)
        );
        renderOrders(filtered);
    };

    window.viewOrderDetails = function(id) {
        const order = currentOrders.find(o => o._id === id);
        if (!order) return;
        // Reuse invoice logic or a simple alert for now
        alert(`Order for ${order.customerName}\nAddress: ${order.shippingAddress}\nTotal: ₦${order.totalAmount.toLocaleString()}\nNotes: ${order.notes || 'None'}`);
    };
    // --- END WEB ORDERS MODULE ---

    // Fetch Inventory from Backend
    async function fetchInventory() {
        try {
            const [prodRes] = await Promise.all([
                fetchWithTimeout(`${API_BASE}/products`),
                fetchCategories() // fetchCategories already handles its own response
            ]);

            if (prodRes.ok) {
                const apiData = await prodRes.json();
                inventory = apiData || []; // Use live data
                renderInventory();
            } else {
                console.error("Failed to fetch inventory from server.");
                renderInventory();
            }
        } catch (error) {
            console.error("Error connecting to backend:", error);
            renderInventory();
        }
    }

    // Call fetch on start (Removed redundant call, init() handles it)

    // 3. Navigation Control
    window.showModule = function(moduleId) {
        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        document.getElementById(`${moduleId}-module`).classList.add('active');
        
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        const activeLi = Array.from(document.querySelectorAll('.sidebar-nav li')).find(li => li.innerText.toLowerCase().includes(moduleId.split('-')[0]));
        if (activeLi) activeLi.classList.add('active');

        // Update Header for Mobile
        const headerTitle = document.querySelector('.sidebar-header h3');
        if (headerTitle) {
            let title = 'Admin Panel';
            if (moduleId === 'pos') title = 'POS Checkout';
            else if (moduleId === 'inventory') title = 'Inventory';
            else if (moduleId === 'orders') title = 'Web Orders';
            else if (moduleId === 'sales') title = 'Sales';
            else if (moduleId === 'spa') title = 'Spa Services';
            headerTitle.innerText = title;
        }

        if (moduleId === 'inventory') renderInventory();
        if (moduleId === 'pos') {
            renderPOSCart();
            setTimeout(() => {
                const searchInput = document.getElementById('posBarcodeSearch');
                if (searchInput) searchInput.focus();
            }, 100);
        }
        if (moduleId === 'orders') fetchOrders();
        if (moduleId === 'sales') { syncSalesWithAPI().then(() => { renderSalesHistory(); updateSaleProductDropdown(); }); }
        if (moduleId === 'expenses') { renderExpenses(); renderCostAnalysis(); fetchExpenseCategories(); }
        if (moduleId === 'analytics') { syncSalesWithAPI().then(() => renderAnalytics()); }
        if (moduleId === 'spa') renderSpaServices();
        if (moduleId === 'adjustments') { renderAdjustments(); updateAdjustmentProductDropdown(); }
        if (moduleId === 'customers') renderCustomers();
        if (moduleId === 'suppliers') renderSuppliers();
        if (moduleId === 'store') { renderStore(); updateStaffRoleDropdown(); fetchCategories(); fetchStaff(); }
        
        enforcePermissions();
    };

    // 4. Image Handling
    window.previewImage = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 1000; // Reduced from 1200

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Further reduced quality to 0.6 for better compatibility
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                
                const preview = document.getElementById('imagePreview');
                preview.src = compressedDataUrl;
                preview.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 5. Inventory Module Functions
    function renderInventory(filterData = inventory) {
        const inventoryBody = document.getElementById('inventoryBody');
        if (!inventoryBody) return;
        inventoryBody.innerHTML = '';
        let totalValue = 0;
        let totalItems = 0;
        let lowStockCount = 0;

        // Permissions for column visibility
        const canSeeFullInventory = sessionStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('inventoryLoggedIn') === 'true';
        const hasAddEditDelete = checkPermission('add_product') || checkPermission('edit_product') || checkPermission('delete_product');
        
        // User said: "add, edit and delete product should only give access to the inventory add new products, search, InventoryTable Image and product info any thing else should not be accessible"
        // This implies if they ONLY have these, they shouldn't see Cost/Retail, Stock, Value, Status.
        // If they are master admin, they see everything.
        const showFinancialsAndStock = canSeeFullInventory || checkPermission('manage_settings'); 

        // Update headers visibility
        const headers = document.querySelectorAll('#inventoryTable thead th');
        if (headers.length >= 7) {
            headers[2].style.display = showFinancialsAndStock ? 'table-cell' : 'none'; // Cost/Retail
            headers[3].style.display = showFinancialsAndStock ? 'table-cell' : 'none'; // Stock
            headers[4].style.display = showFinancialsAndStock ? 'table-cell' : 'none'; // Value
            headers[5].style.display = showFinancialsAndStock ? 'table-cell' : 'none'; // Status
        }

        filterData.forEach(p => {
            const threshold = p.threshold || 5;
            const status = p.stock === 0 ? 'Out of Stock' : (p.stock <= threshold ? 'Low Stock' : 'In Stock');
            const badgeClass = p.stock === 0 ? 'badge-out' : (p.stock <= threshold ? 'badge-low' : 'badge-in');
            
            totalValue += (p.price || 0) * (p.stock || 0);
            totalItems += (p.stock || 0);
            const productValue = (p.price || 0) * (p.stock || 0);
            if (p.stock <= threshold) lowStockCount++;

            const row = document.createElement('tr');
            row.id = `product-${p._id}`;
            row.innerHTML = `
                <td><img src="${p.image || '../Image/Shayor\'s Logo.png'}" class="prod-img-small" loading="lazy"></td>
                <td class="prod-info-cell">
                    <h4>${p.name}</h4>
                    <p>${p.brand} | ${p.size} ${p.shade && p.shade !== 'N/A' ? '| ' + p.shade : ''}</p>
                    <p><small>${p.primaryUnit || ''} ${p.secondaryUnit ? '(' + p.secondaryUnit + ')' : ''} | Barcode: ${p.barcode || 'N/A'}</small></p>
                </td>
                <td style="display: ${showFinancialsAndStock ? 'table-cell' : 'none'}">
                    <small>Cost: ₦${(p.costPrice || 0).toLocaleString()}</small><br>
                    <strong>Retail: ₦${(p.price || 0).toLocaleString()}</strong>
                </td>
                <td style="display: ${showFinancialsAndStock ? 'table-cell' : 'none'}">
                    <div class="stock-control">
                        <button class="btn-stock-out" title="Stock Out" onclick="updateStock('${p._id}', -1)">-</button>
                        <input type="number" value="${p.stock}" onchange="setStock('${p._id}', this.value)">
                        <button class="btn-stock-in" title="Stock In" onclick="updateStock('${p._id}', 1)">+</button>
                    </div>
                </td>
                <td style="display: ${showFinancialsAndStock ? 'table-cell' : 'none'}">
                    <strong>₦${productValue.toLocaleString()}</strong>
                </td>
                <td style="display: ${showFinancialsAndStock ? 'table-cell' : 'none'}"><span class="badge ${badgeClass}">${status}</span></td>
                <td>
                    ${checkPermission('edit_product') ? `<button class="btn secondary" onclick="editProduct('${p._id}')">Edit</button>` : ''}
                    ${checkPermission('delete_product') ? `<button class="btn danger" onclick="deleteProduct('${p._id}')">Del</button>` : ''}
                </td>
            `;
            inventoryBody.appendChild(row);
        });

        document.getElementById('totalProducts').innerText = filterData.length;
        document.getElementById('totalItemsCount').innerText = totalItems.toLocaleString();
        document.getElementById('totalStockValue').innerText = `₦${totalValue.toLocaleString()}`;
        document.getElementById('lowStockCount').innerText = lowStockCount;
    }

    const productForm = document.getElementById('productForm');

    window.toggleForm = function() {
        productForm.classList.toggle('hidden');
        if (productForm.classList.contains('hidden')) {
            productForm.reset();
            document.getElementById('pId').value = '';
            document.getElementById('imagePreview').classList.add('hidden');
        }
    };

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('pId').value;
        const imgPreview = document.getElementById('imagePreview').src;

        const productData = {
            name: document.getElementById('pName').value,
            brand: document.getElementById('pBrand').value,
            category: document.getElementById('pCategory').value,
            shade: document.getElementById('pShade') ? document.getElementById('pShade').value : 'N/A',
            size: document.getElementById('pSize').value,
            barcode: document.getElementById('pBarcode').value || '',
            primaryUnit: document.getElementById('pPrimaryUnit').value || '',
            piecesPerUnit: parseInt(document.getElementById('pPiecesPerUnit').value) || 1,
            secondaryUnit: document.getElementById('pSecondaryUnit').value || '',
            costPrice: parseFloat(document.getElementById('pCostPrice').value),
            price: parseFloat(document.getElementById('pPrice').value),
            stock: parseInt(document.getElementById('pStock').value),
            threshold: parseInt(document.getElementById('pThreshold').value) || 5,
            ingredients: document.getElementById('pIngredients').value || '',
            skinTypes: document.getElementById('pSkinTypes').value || '',
            skinConcern: document.getElementById('pSkinConcern').value || '',
            description: document.getElementById('pDescription').value || '',
            howToUse: document.getElementById('pHowToUse').value || '',
            review: document.getElementById('pReview').value || '',
            image: imgPreview.startsWith('data:') ? imgPreview : (id ? (inventory.find(p=>p._id==id)?.image || '../Image/Shayor\'s Logo.png') : '../Image/Shayor\'s Logo.png')
        };

        try {
            let response;
            if (id) {
                // UPDATE existing product
                response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                // CREATE new product
                response = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify(productData)
                });
            }

            if (response.ok) {
                alert(id ? "Product updated successfully!" : "Product added successfully!");
                fetchInventory(); // Refresh list from backend
                toggleForm();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error("Form submission failed:", error);
            alert("Server connection failed. Product was not saved to database.");
        }
    });

    window.editProduct = function(id) {
        const p = inventory.find(p => p._id === id);
        if (!p) return;
        document.getElementById('pId').value = p._id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pBrand').value = p.brand;
        document.getElementById('pCategory').value = p.category || 'Other';
        document.getElementById('pShade').value = p.shade || '';
        document.getElementById('pSize').value = p.size;
        document.getElementById('pBarcode').value = p.barcode || '';
        document.getElementById('pPrimaryUnit').value = p.primaryUnit || '';
        document.getElementById('pPiecesPerUnit').value = p.piecesPerUnit || 1;
        document.getElementById('pSecondaryUnit').value = p.secondaryUnit || '';
        document.getElementById('pCostPrice').value = p.costPrice || 0;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pStock').value = p.stock;
        document.getElementById('pThreshold').value = p.threshold || 5;
        document.getElementById('pIngredients').value = p.ingredients || '';
        document.getElementById('pSkinTypes').value = p.skinTypes || '';
        document.getElementById('pSkinConcern').value = p.skinConcern || '';
        document.getElementById('pDescription').value = p.description || '';
        document.getElementById('pHowToUse').value = p.howToUse || '';
        document.getElementById('pReview').value = p.review || '';
        if (p.image) {
            const preview = document.getElementById('imagePreview');
            preview.src = p.image;
            preview.classList.remove('hidden');
        }
        toggleForm();
    };

    window.deleteProduct = async function(id) {
        if (confirm('Delete this product?')) {
            try {
                const response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${getAdminToken()}`
                    }
                });
                if (response.ok) {
                    fetchInventory();
                } else {
                    const err = await response.json();
                    alert(`Failed to delete: ${err.message}`);
                }
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Could not delete product from server.");
            }
        }
    };

    window.updateStock = async function(id, change) {
        const p = inventory.find(p => p._id === id);
        if (p) {
            const newStock = Math.max(0, p.stock + change);
            try {
                const response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify({ stock: newStock })
                });
                if (response.ok) {
                    p.stock = newStock;
                    renderInventory();
                }
            } catch (error) {
                console.error("Stock update failed:", error);
            }
        }
    };

    window.setStock = async function(id, val) {
        const p = inventory.find(p => p._id === id);
        if (p) {
            const newStock = Math.max(0, parseInt(val) || 0);
            try {
                const response = await fetch(`${API_BASE}/products/${id}`, {
                    method: 'PATCH',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify({ stock: newStock })
                });
                if (response.ok) {
                    p.stock = newStock;
                    renderInventory();
                }
            } catch (error) {
                console.error("Stock set failed:", error);
            }
        }
    };

    function saveAndRender() {
        localStorage.setItem('shayorsInventory', JSON.stringify(inventory));
        renderInventory();
    }

    window.searchInventory = function() {
        const input = document.getElementById('inventorySearch');
        const term = input.value.toLowerCase().trim();
        const dropdown = document.getElementById('searchResultsDropdown');
        
        if (term.length < 2) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            if (term.length === 0) renderInventory();
            return;
        }

        const filtered = inventory.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.brand.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term))
        );

        if (filtered.length > 0) {
            dropdown.innerHTML = filtered.slice(0, 10).map(p => `
                <div class="search-result-item" onclick="scrollToProduct('${p._id}')">
                    <img src="${p.image || '../Image/Shayor\'s Logo.png'}" alt="${p.name}">
                    <div class="search-result-info">
                        <h5>${p.name}</h5>
                        <p>${p.brand} | ${p.category || 'No Category'}</p>
                    </div>
                </div>
            `).join('');
            dropdown.classList.remove('hidden');
        } else {
            dropdown.innerHTML = '<div class="no-results">No products found</div>';
            dropdown.classList.remove('hidden');
        }

        // We still filter the main table for consistency
        renderInventory(filtered);
    };

    window.scrollToProduct = function(id) {
        const row = document.getElementById(`product-${id}`);
        const dropdown = document.getElementById('searchResultsDropdown');
        const input = document.getElementById('inventorySearch');
        
        dropdown.classList.add('hidden');
        input.value = ''; // Clear search after selection
        renderInventory(); // Show all products so the row exists in DOM
        
        setTimeout(() => {
            const targetRow = document.getElementById(`product-${id}`);
            if (targetRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetRow.classList.add('highlight-row');
                setTimeout(() => targetRow.classList.remove('highlight-row'), 3000);
            }
        }, 100);
    };

    // --- SMART SCANNER LOGIC ---
    let html5QrCode = null;

    let posScanner = null;
    let formScanner = null;
    let invScanner = null;

    window.toggleCameraScanner = function() {
        const isPosActive = document.getElementById('pos-module').classList.contains('active');
        const isFormActive = !document.getElementById('productForm').classList.contains('hidden');
        
        let readerId = 'camera-reader';
        if (isPosActive) {
            readerId = 'pos-camera-reader';
        } else if (isFormActive) {
            readerId = 'form-camera-reader';
        }
        
        const reader = document.getElementById(readerId);
        if (!reader) return;
        
        reader.classList.toggle('hidden');

        if (!reader.classList.contains('hidden')) {
            const scanner = new Html5Qrcode(readerId);
            if (isPosActive) posScanner = scanner; 
            else if (isFormActive) formScanner = scanner;
            else invScanner = scanner;
            
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            scanner.start({ facingMode: "environment" }, config, (text) => {
                onScanSuccess(text);
            }).catch(err => {
                console.error("Camera start error:", err);
                alert("Could not start camera. Please ensure you have given camera permissions.");
                reader.classList.add('hidden');
            });
        } else {
            const scanner = isPosActive ? posScanner : (isFormActive ? formScanner : invScanner);
            if (scanner) {
                scanner.stop().then(() => {
                    scanner.clear();
                    if (isPosActive) posScanner = null; 
                    else if (isFormActive) formScanner = null;
                    else invScanner = null;
                }).catch(e => console.error(e));
            }
        }
    };

    window.fetchProductInfoByBarcode = async function(barcode) {
        if (!barcode) return;
        
        // Show loading state if possible
        const barcodeInput = document.getElementById('pBarcode');
        const originalValue = barcodeInput.value;
        barcodeInput.value = "Fetching info...";
        
        try {
            // Using OpenFoodFacts (Cosmetics are often under the same API or specialized beauty APIs)
            // This is a free public API.
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await response.json();
            
            if (data.status === 1 && data.product) {
                const prod = data.product;
                
                // Auto-fill form fields
                if (prod.product_name) document.getElementById('pName').value = prod.product_name;
                if (prod.brands) document.getElementById('pBrand').value = prod.brands;
                if (prod.quantity) document.getElementById('pSize').value = prod.quantity;
                
                // Attempt to match category
                if (prod.categories) {
                    const categories = prod.categories.toLowerCase();
                    const categorySelect = document.getElementById('pCategory');
                    for (let i = 0; i < categorySelect.options.length; i++) {
                        if (categories.includes(categorySelect.options[i].value.toLowerCase())) {
                            categorySelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                if (prod.ingredients_text) document.getElementById('pIngredients').value = prod.ingredients_text;
                
                alert("Product information found and auto-filled!");
            } else {
                console.warn("Product not found in external database.");
                // Check local database as well
                const localRes = await fetch(`${API_BASE}/products/barcode/${barcode}`);
                if (localRes.ok) {
                    const localProd = await localRes.json();
                    if (confirm("Product already exists in inventory. Load its data?")) {
                        loadProductToForm(localProd);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching product info:", error);
        } finally {
            barcodeInput.value = barcode;
        }
    };

    const pBarcodeInput = document.getElementById('pBarcode');
    if (pBarcodeInput) {
        pBarcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.fetchProductInfoByBarcode(this.value.trim());
            }
        });
    }

    function loadProductToForm(p) {
        document.getElementById('pId').value = p._id || '';
        document.getElementById('pName').value = p.name || '';
        document.getElementById('pBrand').value = p.brand || '';
        document.getElementById('pCategory').value = p.category || 'Scrub';
        document.getElementById('pSize').value = p.size || '';
        document.getElementById('pBarcode').value = p.barcode || '';
        document.getElementById('pPrice').value = p.price || '';
        document.getElementById('pCostPrice').value = p.costPrice || '';
        document.getElementById('pStock').value = p.stock || 0;
        document.getElementById('pThreshold').value = p.threshold || 5;
        document.getElementById('pDescription').value = p.description || '';
        document.getElementById('pIngredients').value = p.ingredients || '';
        
        if (p.image) {
            const preview = document.getElementById('imagePreview');
            preview.src = p.image;
            preview.classList.remove('hidden');
        }
    }

    function onScanSuccess(decodedText) {
        // Success callback
        console.log(`Code scanned: ${decodedText}`);
        
        // If we are in the POS module, add directly to cart
        const posModule = document.getElementById('pos-module');
        const productForm = document.getElementById('productForm');
        
        if (posModule && posModule.classList.contains('active')) {
            document.getElementById('posBarcodeSearch').value = decodedText;
            addToCartByBarcode(decodedText);
        } else if (productForm && !productForm.classList.contains('hidden')) {
            // If product form is open, fill it
            document.getElementById('pBarcode').value = decodedText;
            window.fetchProductInfoByBarcode(decodedText);
        } else {
            // Dashboard mode: Only fill the search input (scanning alone)
            const searchInput = document.getElementById('inventorySearch');
            if (searchInput) {
                searchInput.value = decodedText;
                // Manually trigger the search logic
                if (typeof searchInventory === 'function') searchInventory();
            }
        }
        
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(100);

        // Stop scanner after success to save battery
        window.toggleCameraScanner();
    }

    // --- END SMART SCANNER LOGIC ---

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.search-wrapper');
        const dropdown = document.getElementById('searchResultsDropdown');
        if (wrapper && !wrapper.contains(e.target) && dropdown) {
            dropdown.classList.add('hidden');
        }
    });

    window.importSamples = async function() {
        const samples = [
            { category: "Facesoap", name: "Premium Cleanser", brand: "Shayors", size: "200ml", price: 15000, stock: 20, image: "../Image/WhatsApp1.jpeg", costPrice: 10000, threshold: 5 },
            { category: "Bar soap", name: "Glow Bar", brand: "Shayors", size: "150g", price: 8000, stock: 50, image: "../Image/WhatsApp2.jpeg", costPrice: 5000, threshold: 5 },
            { category: "Cleanser", name: "Deep Pore Cleanser", brand: "Shayors", size: "100ml", price: 20000, stock: 15, image: "../Image/WhatsApp3.jpeg", costPrice: 15000, threshold: 5 },
            { category: "Facecream", name: "Day Glow Cream", brand: "Shayors", size: "50g", price: 25000, stock: 30, image: "../Image/WhatsApp4.jpeg", costPrice: 18000, threshold: 5 },
            { category: "Bar soap", name: "Exfoliating Soap", brand: "Shayors", size: "150g", price: 10000, stock: 40, image: "../Image/WhatsApp5.jpeg", costPrice: 7000, threshold: 5 },
            { category: "Cleanser", name: "Luxury Mist", brand: "Shayors", size: "150ml", price: 15000, stock: 25, image: "../Image/WhatsApp6.jpeg", costPrice: 10000, threshold: 5 },
            { category: "Perfume oil", name: "Midnight Scent", brand: "Shayors", size: "30ml", price: 35000, stock: 10, image: "../Image/WhatsApp7.jpeg", costPrice: 25000, threshold: 5 },
            { category: "Scrub", name: "Sugar Glow Scrub", brand: "Shayors", size: "250g", price: 18000, stock: 20, image: "../Image/WhatsApp8.jpeg", costPrice: 12000, threshold: 5 },
            { category: "Lotion", name: "Hydrating Body Milk", brand: "Shayors", size: "400ml", price: 22000, stock: 15, image: "../Image/WhatsApp9.jpeg", costPrice: 15000, threshold: 5 },
            { category: "Serum", name: "Vitamin C Serum", brand: "Shayors", size: "30ml", price: 30000, stock: 12, image: "../Image/WhatsApp10.jpeg", costPrice: 20000, threshold: 5 },
            { category: "Facecream", name: "Night Repair Cream", brand: "Shayors", size: "50g", price: 35000, stock: 10, image: "../Image/WhatsApp11.jpeg", costPrice: 25000, threshold: 5 }
        ];

        if (!confirm(`Import all ${samples.length} original products to your database for full sync?`)) return;

        const btn = document.getElementById('importBtn');
        btn.disabled = true;
        btn.innerText = "Syncing...";

        let successCount = 0;
        for (const p of samples) {
            try {
                const response = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAdminToken()}`
                    },
                    body: JSON.stringify(p)
                });
                if (response.ok) successCount++;
            } catch (e) { console.error("Sync failed for", p.name); }
        }

        alert(`Sync completed! ${successCount} products added to your database.`);
        btn.innerText = "Import Samples";
        btn.disabled = false;
        fetchInventory();
    };

    // 6. Sales Module Functions
    window.showNewSaleForm = function() {
        document.getElementById('newSaleSection').classList.toggle('hidden');
        updateSaleProductDropdown();
        togglePaymentFields(); // Initial state
        renderRecentPosTransactions();
    };

    window.togglePaymentFields = function() {
        const status = document.getElementById('salePaymentStatus').value;
        const paidFields = document.getElementById('paidFields');
        const partlyPaidFields = document.getElementById('partlyPaidFields');

        if (status === 'Paid') {
            paidFields.classList.remove('hidden');
            partlyPaidFields.classList.add('hidden');
        } else if (status === 'Partly Paid') {
            paidFields.classList.remove('hidden'); // Still need payment method for partial
            partlyPaidFields.classList.remove('hidden');
        } else {
            paidFields.classList.add('hidden');
            partlyPaidFields.classList.add('hidden');
        }
    };

    window.applyCustomPricing = function() {
        const newPrice = prompt("Enter Custom Price for current product selection:");
        if (newPrice && !isNaN(newPrice)) {
            document.getElementById('salePrice').value = newPrice;
        }
    };

    window.clearAllSale = function() {
        if (confirm("Clear all items and customer info?")) {
            currentSaleItems = [];
            currentCharges = [];
            renderCurrentSaleList();
            renderCharges();
            document.getElementById('saleCustomerName').value = '';
            document.getElementById('saleCustomerContact').value = '';
            document.getElementById('saleNote').value = '';
            document.getElementById('saleDiscount').value = 0;
            if (document.getElementById('saleCharges')) document.getElementById('saleCharges').value = 0;
            document.getElementById('saleAmountPaid').value = '';
            document.getElementById('saleProduct').value = '';
            document.getElementById('saleProductSearch').value = '';
            document.getElementById('saleQty').value = 1;
            document.getElementById('salePrice').value = '';
        }
    };

    function updateSaleProductDropdown() {
        // No longer needed as we use searchable input
    }

    window.updateSalePrice = function() {
        const id = document.getElementById('saleProduct').value;
        if (id) {
            const p = inventory.find(p => p._id == id);
            document.getElementById('salePrice').value = p.price;
        }
    };

    window.addToSaleList = function() {
        const productId = document.getElementById('saleProduct').value;
        const unitType = document.getElementById('saleUnitType').value;
        const qty = parseInt(document.getElementById('saleQty').value);
        const price = parseFloat(document.getElementById('salePrice').value);

        if (!productId) return alert('Select a product');
        const product = inventory.find(p => p._id == productId);
        
        let piecesPerUnit = product.piecesPerUnit || 1;
        let actualQty = (unitType === 'Dozen' || unitType === product.primaryUnit) ? qty * piecesPerUnit : qty;
        
        if (product.stock < actualQty) return alert('Insufficient stock');

        currentSaleItems.push({
            productId: product._id,
            name: product.name,
            description: product.description || `${product.brand || ''} ${product.size || ''}`,
            qty: qty,
            unitType: unitType,
            actualQty: actualQty,
            price: price,
            total: qty * price
        });

        renderCurrentSaleList();

        // Reset selection
        document.getElementById('saleProduct').value = '';
        document.getElementById('saleProductSearch').value = '';
        document.getElementById('saleQty').value = 1;
        document.getElementById('salePrice').value = '';
    };

    function renderCurrentSaleList() {
        const body = document.getElementById('saleListBody');
        if (!body) return;
        body.innerHTML = '';
        currentSaleItems.forEach((item, index) => {
            body.innerHTML += `
                <tr>
                    <td>${item.name} (${item.unitType})</td>
                    <td>${item.qty}</td>
                    <td>₦${item.price.toLocaleString()}</td>
                    <td>₦${item.total.toLocaleString()}</td>
                    <td><button class="btn danger" onclick="removeFromSale(${index})">x</button></td>
                </tr>
            `;
        });
        updateSaleTotal();
    }

    function updateSaleTotal() {
        const subtotal = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
        let totalCharges = 0;
        
        currentCharges.forEach(c => {
            if (c.type === 'percent') {
                totalCharges += (subtotal * c.value) / 100;
            } else {
                totalCharges += c.value;
            }
        });

        const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
        const grandTotal = subtotal + totalCharges - discount;
        
        const display = document.getElementById('currentSaleTotal');
        if (display) {
            display.innerText = `₦${grandTotal.toLocaleString()}`;
        }
        return grandTotal;
    }

    window.removeFromSale = function(index) {
        currentSaleItems.splice(index, 1);
        renderCurrentSaleList();
    };

    window.finalizeSale = async function(type) {
        if (currentSaleItems.length === 0) return alert('Add items to sale');
        
        const customerName = document.getElementById('saleCustomerName').value || 'Walk-in Customer';
        const contact = document.getElementById('saleCustomerContact').value || '';
        const paymentStatus = document.getElementById('salePaymentStatus').value;
        const paymentMethod = document.getElementById('salePaymentMethod').value;
        const amountPaid = parseFloat(document.getElementById('saleAmountPaid').value) || 0;
        const platform = document.getElementById('salePlatform').value;
        const deliveryStatus = document.getElementById('saleDeliveryStatus').value;
        const note = document.getElementById('saleNote').value;
        const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
        
        let subtotal = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
        let totalUnits = currentSaleItems.reduce((sum, item) => sum + (item.qty || 0), 0);
        const grandTotal = updateSaleTotal();
        const charges = grandTotal - subtotal + discount;

        const orderData = {
            customerName,
            customerPhone: contact,
            customerEmail: '', // Not collected in dashboard
            shippingAddress: 'In-Store',
            items: currentSaleItems.map(item => ({
                productId: item.productId,
                productName: item.name,
                description: item.description,
                quantity: item.actualQty,
                price: item.price
            })),
            totalAmount: grandTotal,
            paymentMethod,
            paymentStatus: paymentStatus.toLowerCase() === 'paid' ? 'paid' : (paymentStatus.toLowerCase() === 'partly paid' ? 'partly paid' : 'unpaid'),
            orderStatus: 'completed',
            platform: platform || 'In-Store',
            charges: currentCharges,
            notes: note
        };

        try {
            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAdminToken()}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const createdOrder = await response.json();
                
                // Add to local sales history for immediate display
                const sale = {
                    id: createdOrder._id,
                    apiId: createdOrder._id,
                    date: createdOrder.createdAt,
                    customer: customerName,
                    contact: contact,
                    items: [...currentSaleItems],
                    subtotal: subtotal,
                    discount: discount,
                    charges: charges,
                    total: grandTotal,
                    status: paymentStatus, 
                    paymentMethod: paymentMethod,
                    amountPaid: paymentStatus === 'Paid' ? grandTotal : amountPaid,
                    platform: platform,
                    deliveryStatus: deliveryStatus,
                    note: note,
                    type: type 
                };

                sales.push(sale);
                localStorage.setItem('shayorsSales', JSON.stringify(sales));

                if (contact || customerName !== 'Walk-in Customer') {
                    const debtorRecord = {
                        id: 'C' + Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        invoiceNo: sale.id,
                        name: customerName,
                        contact: contact,
                        product: currentSaleItems.map(i => `${i.name} (x${i.qty})`).join(', '),
                        totalUnits: totalUnits,
                        totalAmount: grandTotal,
                        partlyPaid: sale.amountPaid,
                        dueDate: '',
                        status: paymentStatus
                    };
                    customers.push(debtorRecord);
                    localStorage.setItem('shayorsCustomers', JSON.stringify(customers));
                }

                if (platform === 'WhatsApp' || type === 'whatsapp') {
                    sendWhatsAppOrder(sale);
                }

                downloadInvoice(sale.id);
                
                currentSaleItems = [];
                renderCurrentSaleList();
                await fetchInventory(); // Refresh stock levels from server
                renderSalesHistory();
                renderRecentPosTransactions();
                document.getElementById('newSaleSection').classList.add('hidden');
                alert('Sale Recorded Successfully!');
            } else {
                const err = await response.json();
                alert(`Failed to save sale: ${err.message}`);
            }
        } catch (error) {
            console.error("Sale finalization failed:", error);
            alert("Connection error. Could not save sale to database.");
        }
    };

    window.returnSale = function(id) {
        if (confirm('Return this sale? Stock will be restored and sale will be removed.')) {
            const saleIdx = sales.findIndex(s => s.id === id);
            const sale = sales[saleIdx];
            
            const adminToken = getAdminToken();
            
            // Restore Stock
            sale.items.forEach(async (item) => {
                const p = inventory.find(p => p._id == item.productId);
                if (p) {
                    const newStock = p.stock + item.actualQty;
                    p.stock = newStock;
                    
                    try {
                        await fetch(`${API_BASE}/products/${p._id}`, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminToken}`
                            },
                            body: JSON.stringify({ stock: newStock })
                        });
                    } catch (error) {
                        console.error(`Stock restore failed for ${p.name}:`, error);
                    }
                }
            });

            // Adjust Customer Balance or remove record
            const custIdx = customers.findIndex(c => c.invoiceNo === sale.id);
            if (custIdx !== -1) {
                customers.splice(custIdx, 1);
            }
            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));

            sales.splice(saleIdx, 1);
            localStorage.setItem('shayorsSales', JSON.stringify(sales));
            // Removed localStorage inventory sync
            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));
            renderSalesHistory();
            alert('Sale returned and stock restored.');
        }
    };

    function sendWhatsAppOrder(sale) {
        let msg = `*New Order from Shayors Cosmetics*%0A`;
        msg += `Customer: ${sale.customer}%0A`;
        msg += `Status: ${sale.status}%0A`;
        msg += `Items:%0A`;
        sale.items.forEach(item => {
            msg += `- ${item.name} x${item.qty} (₦${item.total.toLocaleString()})%0A`;
        });
        msg += `*Total: ₦${sale.total.toLocaleString()}*%0A`;
        window.open(`https://wa.me/2348189085285?text=${msg}`); 
    }

    window.renderInvoice = function(sale, shouldScroll = true) {
        const container = document.getElementById('invoiceContainer');
        const dateStr = new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const invoiceNo = `INV-${(sale.apiId || sale.id).toString().slice(-6).toUpperCase()}`;

        container.innerHTML = `
            <div id="invoice-template" style="padding: 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background: #fff; width: 750px; margin: 0 auto; box-sizing: border-box; line-height: 1.4;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
                    <div style="display: flex; align-items: flex-start;">
                        <img src="../Image/Shayor's Cosmetics .png" style="width: 90px; margin-right: 20px;">
                        <div>
                            <h1 style="margin: 0; font-size: 20px; color: #000; font-weight: bold; letter-spacing: 0.5px;">SHAYORS COSMETICS</h1>
                            <p style="margin: 5px 0; font-size: 11px; font-weight: 600; color: #555; line-height: 1.4;">
                                Shop Yk 059, Floor 1, Adebgite shopping complex, Adebisi street, Itire/ikate<br>
                                Surulere Lagos 101241 Nigeria<br>
                                +2348189085285, +2348079333403<br>
                                shayorscosmestics@gmail.com | www.shayorscosmestics.com
                            </p>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; justify-content: center;">
                        <h2 style="margin: 0; color: #004936; font-size: 32px; font-weight: 300; letter-spacing: 3px; opacity: 0.8;">INVOICE</h2>
                    </div>
                </div>

                <!-- Details Grid -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
                    <div style="width: 48%; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; background: #fafafa;">
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse; min-width: auto; table-layout: fixed;">
                            <tr><td style="color: #777; font-weight: 700; width: 90px; padding: 3px 0;">Invoice#</td><td style="font-weight: 600;">: ${invoiceNo}</td></tr>
                            <tr><td style="color: #777; font-weight: 700; padding: 3px 0;">Invoice Date</td><td style="font-weight: 600;">: ${dateStr}</td></tr>
                            <tr><td style="color: #777; font-weight: 700; padding: 3px 0;">Terms</td><td style="font-weight: 600;">: Due on Receipt</td></tr>
                            <tr><td style="color: #777; font-weight: 700; padding: 3px 0;">Due Date</td><td style="font-weight: 600;">: ${dateStr}</td></tr>
                        </table>
                    </div>
                    
                    <div style="width: 48%; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; background: #fff;">
                        <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #777; text-transform: uppercase;">Payment Details</h4>
                        <p style="margin: 3px 0; font-size: 12px; color: #000;">Account: <strong>0089883643</strong></p>
                        <p style="margin: 3px 0; font-size: 12px; color: #000;">Bank: <strong>Sterling</strong></p>
                        <p style="margin: 3px 0; font-size: 12px; color: #000;">Name: <strong>Shayors Cosmetics</strong></p>
                    </div>
                </div>
                

                <!-- Bill To -->
                <div style="margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
                    <div style="background: #f5f5f5; padding: 6px 15px; font-weight: 600; font-size: 11px; color: #444; border-bottom: 1px solid #e0e0e0; text-transform: uppercase;">Bill To</div>
                    <div style="padding: 10px 15px; font-size: 14px; font-weight: bold; color: #000;">${sale.customer || 'Walk-in Customer'}</div>
                </div>

                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; min-width: auto;">
                    <thead>
                        <tr style="background: #333; color: #fff;">
                            <th style="padding: 10px; text-align: left; width: 30px; font-size: 11px; border: none;">#</th>
                            <th style="padding: 10px; text-align: left; font-size: 11px; border: none;">ITEM & DESCRIPTION</th>
                            <th style="padding: 10px; text-align: center; width: 70px; font-size: 11px; border: none;">Qty</th>
                            <th style="padding: 10px; text-align: right; width: 100px; font-size: 11px; border: none;">Rate</th>
                            <th style="padding: 10px; text-align: right; width: 110px; font-size: 11px; border: none;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map((item, index) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; text-align: center; font-size: 12px; color: #666; vertical-align: top;">${index + 1}</td>
                                <td style="padding: 10px; font-size: 12px; vertical-align: top; word-wrap: break-word;">
                                    <div style="font-weight: 600; color: #000;">${item.name || item.productName || 'Unnamed Product'}</div>
                                </td>
                                <td style="padding: 10px; text-align: center; font-size: 12px; vertical-align: top;">${item.qty || item.quantity || 0}.00</td>
                                <td style="padding: 10px; text-align: right; font-size: 12px; vertical-align: top;">${(item.price || 0).toLocaleString()}.00</td>
                                <td style="padding: 10px; text-align: right; font-size: 12px; vertical-align: top; font-weight: 600;">${(item.total || ((item.price || 0) * (item.qty || item.quantity || 0)) || 0).toLocaleString()}.00</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Bottom Summary Section -->
                <div style="display: flex; justify-content: space-between; page-break-inside: avoid;">
                    <div style="width: 50%; font-size: 10px; color: #666;">
                        <div style="margin-top: 10px;  padding-top: 10px;">
                            <p style="margin: 0; font-weight: bold; color: #000; font-size: 11px;">Terms & Conditions</p>
                            <p style="margin: 4px 0; color: #777;">Returns Policy ————————</p>
                            <p style="margin: 0; font-weight: 800; line-height: 1.4;">For hygiene and safety reasons, we cannot accept returns of opened items. If your order arrives damaged, incorrect, or you wish to return an unopened product. please contact us within 24 hrs of delivery. Replacements will be arranged in line with our policy.</p>
                        </div>
                    </div>
                    <div style="width: 40%; background: #fafafa; padding: 15px; border-radius: 4px; height: fit-content; border: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                            <span style="color: #777;">Sub Total</span>
                            <span style="color: #444;">${(sale.total || sale.totalAmount || 0).toLocaleString()}.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #eee; font-weight: bold; font-size: 12px;">
                            <span style="color: #000;">Total</span>
                            <span style="color: #000;">₦${(sale.total || sale.totalAmount || 0).toLocaleString()}.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 0 0; margin-top: 5px;">
                            <span style="font-weight: bold; color: #2e7d32; font-size: 13px;">Balance Due</span>
                            <span style="font-weight: bold; color: #2e7d32; font-size: 16px;">₦${(sale.total || sale.totalAmount || 0).toLocaleString()}.00</span>
                        </div>
                    </div>
                </div>

                <!-- Footer attribution -->
                <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                    <div style="color: #999; font-size: 9px; text-align: left;">
                        <p style="margin: 0; font-weight: 600;">Thank you for your patronage!</p>
                        <p style="margin: 5px 0 0; font-weight: 600; color: #555;">Scan to visit our website: <strong>www.shayorscosmestics.com</strong></p>
                    </div>
                    <div id="invoice-qrcode" style="width: 60px; height: 60px;"></div>
                </div>
            </div>
        `;
        
        // Generate QR code after innerHTML is set
        setTimeout(() => {
            const qrContainer = document.getElementById('invoice-qrcode');
            if (qrContainer) {
                qrContainer.innerHTML = ''; // Clear previous if any
                new QRCode(qrContainer, {
                    text: "https://www.shayorscosmestics.com",
                    width: 60,
                    height: 60,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }
        }, 10);
        
        if (shouldScroll) {
            container.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.downloadInvoice = async function(id) {
        const sale = sales.find(s => s.apiId === id || s.id === id);
        if (!sale) return;
        
        // Mark as Paid if not already
        if (sale.status !== 'Paid') {
            sale.status = 'Paid';
            sale.amountPaid = sale.total;
            localStorage.setItem('shayorsSales', JSON.stringify(sales));
            
            // Remove from debtors
            await removeDebtorByOrderInfo(sale.customer, id, sale.platform);
            
            // Sync to backend if it has an apiId
            const apiId = sale.apiId || (sale.id.length > 20 ? sale.id : null);
            if (apiId) {
                const token = getAdminToken();
                let endpoint = '';
                if (sale.platform === 'Web Store') endpoint = `${API_BASE}/orders/${apiId}/status`;
                else if (sale.platform === 'POS') endpoint = `${API_BASE}/sales/${apiId}`;
                else if (sale.platform === 'WhatsApp') endpoint = `${API_BASE}/bookings/${apiId}`;

                if (endpoint) {
                    try {
                        await fetch(endpoint, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ paymentStatus: 'paid' })
                        });
                    } catch (err) { console.error("Failed to sync payment status:", err); }
                }
            }
            renderSalesHistory();
        }

        // Render it first WITHOUT scrolling to avoid capturing blank area during scroll
        renderInvoice(sale, false);
        const invoiceNo = `INV-${(sale.apiId || sale.id).toString().slice(-6).toUpperCase()}`;

        const opt = {
            margin: [0.2, 0.2],
            filename: `${invoiceNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                width: 750,
                scrollY: 0 // Crucial: forces capture to ignore current page scroll
            },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        const template = document.getElementById('invoice-template');
        
        // Use a slight timeout to ensure innerHTML is fully rendered before capture
        setTimeout(() => {
            html2pdf().from(template).set(opt).save();
        }, 500);
    };

    async function syncStatusToSalesAndOrders(invoiceNo, status) {
        if (!invoiceNo || !invoiceNo.startsWith('INV-')) return;
        const shortId = invoiceNo.replace('INV-', '').toUpperCase();
        
        // Find matching sale in local array
        const sale = sales.find(s => {
            const saleId = (s.apiId || s.id || '').toString().toUpperCase();
            return saleId.endsWith(shortId);
        });

        if (sale) {
            sale.status = status;
            localStorage.setItem('shayorsSales', JSON.stringify(sales));
            
            // Sync to backend
            const apiId = sale.apiId || (sale.id.length > 20 ? sale.id : null);
            if (apiId) {
                const token = getAdminToken();
                let endpoint = '';
                const backendStatus = status.toLowerCase(); // Map 'Paid' to 'paid', etc.
                
                if (sale.platform === 'Web Store') endpoint = `${API_BASE}/orders/${apiId}/status`;
                else if (sale.platform === 'POS') endpoint = `${API_BASE}/sales/${apiId}`; // Note: Backend POS status update might not exist yet
                else if (sale.platform === 'WhatsApp') endpoint = `${API_BASE}/bookings/${apiId}`;

                if (endpoint) {
                    try {
                        await fetch(endpoint, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ paymentStatus: backendStatus })
                        });
                    } catch (err) { console.error("Sync failed:", err); }
                }
            }
            renderSalesHistory();
        }
    }

    async function renderSalesHistory() {
        const body = document.getElementById('salesHistoryBody');
        if (!body) return;
        
        const dateFilter = document.getElementById('salesDateFilter')?.value;
        
        // Use reconciled sales from localStorage sorted by date descending
        let filteredSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (dateFilter) {
            filteredSales = filteredSales.filter(s => {
                const saleDate = new Date(s.date || s.createdAt).toISOString().split('T')[0];
                return saleDate === dateFilter;
            });
        }

        // Permissions for column visibility
        const canSeeFullSales = sessionStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('shayorsIsAdmin') === 'true' || localStorage.getItem('inventoryLoggedIn') === 'true';
        const canConfirmPayment = checkPermission('confirm_sales_payment');
        const canDeleteRecords = checkPermission('delete_records');
        const canExportData = checkPermission('export_data');
        const isReportOnly = checkPermission('view_reports') || checkPermission('view_weekly_sales_summary');
        
        // "view_weekly_sales_summary and view_reports can only have access to... sales and invoice history(id, date, customer, items, total, type) alone"
        // This means they should NOT see Status or Actions.
        const showStatus = canSeeFullSales || canConfirmPayment || checkPermission('record_sale');
        const showActions = canSeeFullSales || canDeleteRecords || canExportData || checkPermission('edit_invoice_style') || checkPermission('view_records') || checkPermission('record_sale');

        // Update headers visibility
        const headers = document.querySelectorAll('#salesHistoryTable thead th');
        if (headers.length >= 7) {
            headers[5].style.display = showStatus ? 'table-cell' : 'none'; // Status
            headers[6].style.display = showActions ? 'table-cell' : 'none'; // Actions
        }
        
        body.innerHTML = '';
        filteredSales.forEach(s => {
            const date = new Date(s.date || s.createdAt).toLocaleDateString();
            const itemCount = Array.isArray(s.items) ? s.items.length : 1;
            const status = s.status || 'Paid';
            const statusClass = status === 'Paid' ? 'status-paid' : 'status-unpaid';
            
            const displayId = (s.apiId || s.id || s._id || '').toString().slice(-6).toUpperCase();
            const orderId = s.apiId || s.id || s._id;
            
            body.innerHTML += `
                <tr>
                    <td>${displayId}</td>
                    <td>${date}</td>
                    <td>${s.customer || 'Walk-in'}</td>
                    <td>${itemCount} items (${s.type || 'product'})</td>
                    <td>₦${parseFloat(s.total || s.totalAmount || 0).toLocaleString()}</td>
                    <td style="display: ${showStatus ? 'table-cell' : 'none'}">
                        ${status === 'Paid' ? `
                            <div style="background: #e6f4ea; color: #1e7e34; padding: 4px 12px; border-radius: 12px; font-weight: bold; border: 1px solid #c3e6cb; display: inline-block; font-size: 0.8rem;">
                                PAID
                            </div>
                        ` : `
                            <select onchange="updateSalePaymentStatus('${orderId}', this.value)" class="status-select ${statusClass}">
                                <option value="Paid" ${status === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Unpaid" ${status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                                <option value="Partly Paid" ${status === 'Partly Paid' ? 'selected' : ''}>Partly Paid</option>
                                <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
                            </select>
                        `}
                    </td>
                    <td style="display: ${showActions ? 'table-cell' : 'none'}">
                        <button class="btn secondary" onclick='viewOrder("${orderId}")'>View</button>
                        ${checkPermission('export_data') ? `<button class="btn primary" onclick='downloadInvoice("${orderId}")'>Inv</button>` : ''}
                        ${checkPermission('delete_records') ? `<button class="btn danger" onclick='deleteOrder("${orderId}")'>Del</button>` : ''}
                    </td>
                </tr>
            `;
        });
        
        if (filteredSales.length === 0) {
            body.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">No orders found ${dateFilter ? 'for ' + dateFilter : ''}.</td></tr>`;
        }
    }

    async function removeDebtorByOrderInfo(customerName, orderId, platform) {
        const token = getAdminToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const customers = await res.json();
                const shortId = orderId.toString().slice(-6).toUpperCase();
                const possibleInvoiceNos = [
                    `WEB-${shortId}`,
                    `INV-${shortId}`,
                    `POS-${shortId}`
                ];

                const debtorsToRemove = customers.filter(c => 
                    (possibleInvoiceNos.includes(c.invoiceNo) || (c.name === customerName)) && 
                    (c.status === 'Unpaid' || c.status === 'Partly Paid')
                );

                for (const debtor of debtorsToRemove) {
                    await fetch(`${API_BASE}/customers/${debtor._id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            }
        } catch (err) {
            console.error("Failed to remove debtor:", err);
        }
    }

    window.updateSalePaymentStatus = async function(id, status) {
        const sale = sales.find(s => s.apiId === id || s.id === id);
        if (!sale) return;
        
        sale.status = status;
        if (status === 'Paid') {
            sale.amountPaid = sale.total;
            await removeDebtorByOrderInfo(sale.customer, id, sale.platform);
        }
        localStorage.setItem('shayorsSales', JSON.stringify(sales));
        
        // Sync to backend
        const apiId = sale.apiId || (sale.id.length > 20 ? sale.id : null);
        if (apiId) {
            const token = getAdminToken();
            let endpoint = '';
            const backendStatus = status.toLowerCase();
            
            if (sale.platform === 'Web Store') endpoint = `${API_BASE}/orders/${apiId}/status`;
            else if (sale.platform === 'POS') endpoint = `${API_BASE}/sales/${apiId}`;
            else if (sale.platform === 'WhatsApp') endpoint = `${API_BASE}/bookings/${apiId}`;

            if (endpoint) {
                try {
                    await fetch(endpoint, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ paymentStatus: backendStatus })
                    });
                } catch (err) { console.error("Sync failed:", err); }
            }
        }
        renderSalesHistory();
        if (sale.platform === 'Web Store') fetchOrders(); // Update web orders module if visible
    };

    window.clearSalesDateFilter = function() {
        const filter = document.getElementById('salesDateFilter');
        if (filter) filter.value = '';
        renderSalesHistory();
    };

    window.viewOrder = async function(id) {
        // Try local first
        const localSale = sales.find(s => s.apiId === id || s.id === id);
        
        if (localSale) {
            renderInvoice(localSale);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/orders/${id}`, {
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            if (response.ok) {
                const order = await response.json();
                // Map API order to sale format for rendering
                const mappedSale = {
                    id: order._id,
                    apiId: order._id,
                    date: order.createdAt,
                    customer: order.customerName,
                    total: order.totalAmount,
                    items: order.items.map(i => ({
                        name: i.productName,
                        qty: i.quantity,
                        price: i.price,
                        total: i.price * i.quantity
                    }))
                };
                renderInvoice(mappedSale);
            }
        } catch (e) { 
            console.error(e);
        }
    };

    window.deleteOrder = async function(id) {
        if (!id || id === "undefined" || id === "null") {
            alert("Could not determine record ID for deletion.");
            return;
        }
        
        if (!confirm("Delete this order? This action will remove it from both local and server records.")) return;
        
        try {
            const token = getAdminToken();
            const headers = { 'Authorization': `Bearer ${token}` };

            // Try deleting from various endpoints (Orders, Bookings, Sales)
            const endpoints = [
                `${API_BASE}/orders/${id}`,
                `${API_BASE}/bookings/${id}`,
                `${API_BASE}/sales/${id}`
            ];

            let deletedOnServer = false;
            let errors = [];
            
            // Try each endpoint sequentially until one succeeds
            for (const url of endpoints) {
                try {
                    const res = await fetch(url, { method: 'DELETE', headers });
                    if (res.ok) {
                        console.log(`Deleted successfully from ${url}`);
                        deletedOnServer = true;
                        break; // Stop after first successful deletion
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        errors.push(`${url}: ${res.status} ${errorData.message || ''}`);
                    }
                } catch (err) {
                    console.warn(`Delete failed for ${url}`, err);
                    errors.push(`${url}: ${err.message}`);
                }
            }

            if (!deletedOnServer) {
                console.error("Server deletion failed for all endpoints:", errors);
                // We don't alert here anymore to avoid annoying the user if it's already gone from server
                // but still in local list.
            }

            // PERMANENT LOCAL FIX: Add to deleted IDs list so sync doesn't bring it back
            let deletedIds = JSON.parse(localStorage.getItem('shayorsDeletedSalesIds')) || [];
            if (!deletedIds.includes(id)) {
                deletedIds.push(id);
                localStorage.setItem('shayorsDeletedSalesIds', JSON.stringify(deletedIds));
            }

            // Remove from local - check all possible ID fields
            sales = sales.filter(s => s.apiId !== id && s.id !== id && s._id !== id);
            localStorage.setItem('shayorsSales', JSON.stringify(sales));

            renderSalesHistory();
            renderRecentPosTransactions();
            if (typeof renderAnalytics === 'function') renderAnalytics();
            
            alert("Order deleted successfully.");
        } catch (e) { 
            console.error(e); 
            renderSalesHistory();
            alert("Error deleting order: " + (e.message || "Unknown error"));
        }
    };

    // 7. Expenses Module
    window.showExpenseForm = function() {
        document.getElementById('expenseForm').classList.toggle('hidden');
    };

    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const exp = {
            date: document.getElementById('expDate').value,
            code: document.getElementById('expCode').value || 'EXP-' + Date.now().toString().slice(-4),
            category: document.getElementById('expCategory').value,
            description: document.getElementById('expName').value,
            vendor: document.getElementById('expVendor').value,
            paymentMethod: document.getElementById('expPaymentMethod').value,
            amount: parseFloat(document.getElementById('expAmount').value),
            status: document.getElementById('expStatus').value
        };
        expenses.push(exp);
        localStorage.setItem('shayorsExpenses', JSON.stringify(expenses));
        renderExpenses();
        document.getElementById('expenseForm').reset();
    });

    function renderExpenses() {
        const body = document.getElementById('expensesBody');
        if (!body) return;
        body.innerHTML = '';
        expenses.slice().reverse().forEach((e, idx) => {
            body.innerHTML += `
                <tr>
                    <td>${e.date}</td>
                    <td>${e.code || ''}</td>
                    <td>${e.category}</td>
                    <td>${e.description}</td>
                    <td>${e.vendor || 'N/A'}</td>
                    <td>${e.paymentMethod || 'N/A'}</td>
                    <td>₦${(e.amount || 0).toLocaleString()}</td>
                    <td><span class="badge ${e.status === 'Paid' ? 'badge-in' : (e.status === 'Pending' ? 'badge-out' : 'badge-low')}">${e.status}</span></td>
                    <td><button class="btn danger" onclick="deleteExpense(${idx})">Del</button></td>
                </tr>
            `;
        });
    }

    window.deleteExpense = function(idx) {
        expenses.splice(expenses.length - 1 - idx, 1);
        localStorage.setItem('shayorsExpenses', JSON.stringify(expenses));
        renderExpenses();
    };

    // Cost Analysis Functions
    window.showCostAnalysisForm = function() {
        document.getElementById('costAnalysisForm').classList.toggle('hidden');
    };

    window.calcCostAnalysis = function() {
        const raw = parseFloat(document.getElementById('costRawMaterials').value) || 0;
        const container = parseFloat(document.getElementById('costContainer').value) || 0;
        const label = parseFloat(document.getElementById('costLabel').value) || 0;
        const seals = parseFloat(document.getElementById('costSeals').value) || 0;
        const logistics = parseFloat(document.getElementById('costLogistics').value) || 0;
        const output = parseFloat(document.getElementById('costOutput').value) || 1;

        const totalInput = raw + container + label + seals + logistics;
        const costPrice = totalInput / (output || 1);

        const resTotalInput = document.getElementById('resTotalInput');
        const resCostPrice = document.getElementById('resCostPrice');
        if (resTotalInput) resTotalInput.innerText = `₦${totalInput.toLocaleString()}`;
        if (resCostPrice) resCostPrice.innerText = `₦${costPrice.toLocaleString()}`;
    };

    const costAnalysisForm = document.getElementById('costAnalysisForm');
    if (costAnalysisForm) {
        costAnalysisForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const totalInputRaw = document.getElementById('resTotalInput').innerText.replace('₦', '').replace(/,/g, '');
            const costPriceRaw = document.getElementById('resCostPrice').innerText.replace('₦', '').replace(/,/g, '');

            const analysis = {
                id: Date.now(),
                date: document.getElementById('costDate').value,
                productName: document.getElementById('costProductName').value,
                category: document.getElementById('costCategory').value,
                size: document.getElementById('costSize').value,
                rawMaterials: parseFloat(document.getElementById('costRawMaterials').value) || 0,
                container: parseFloat(document.getElementById('costContainer').value) || 0,
                label: parseFloat(document.getElementById('costLabel').value) || 0,
                seals: parseFloat(document.getElementById('costSeals').value) || 0,
                logistics: parseFloat(document.getElementById('costLogistics').value) || 0,
                totalInput: parseFloat(totalInputRaw) || 0,
                output: parseFloat(document.getElementById('costOutput').value) || 0,
                costPrice: parseFloat(costPriceRaw) || 0
            };
            
            costAnalysis.push(analysis);
            localStorage.setItem('shayorsCostAnalysis', JSON.stringify(costAnalysis));
            renderCostAnalysis();
            
            costAnalysisForm.reset();
            document.getElementById('resTotalInput').innerText = '₦0.00';
            document.getElementById('resCostPrice').innerText = '₦0.00';
            costAnalysisForm.classList.add('hidden');
        });
    }

    function renderCostAnalysis() {
        const body = document.getElementById('costAnalysisBody');
        if (!body) return;
        body.innerHTML = '';
        
        costAnalysis.slice().reverse().forEach((c, idx) => {
            body.innerHTML += `
                <tr>
                    <td>${c.date}</td>
                    <td>${c.productName}</td>
                    <td>${c.category}</td>
                    <td>${c.size}</td>
                    <td>₦${(c.rawMaterials || 0).toLocaleString()}</td>
                    <td>₦${(c.totalInput || 0).toLocaleString()}</td>
                    <td>${c.output || 0}</td>
                    <td>₦${(c.costPrice || 0).toLocaleString()}</td>
                    <td><button class="btn danger" onclick="deleteCostAnalysis(${idx})">Del</button></td>
                </tr>
            `;
        });
    }

    window.deleteCostAnalysis = function(idx) {
        if (!confirm("Delete this analysis record?")) return;
        costAnalysis.splice(costAnalysis.length - 1 - idx, 1);
        localStorage.setItem('shayorsCostAnalysis', JSON.stringify(costAnalysis));
        renderCostAnalysis();
    };

    // 8. Analytics Module
    let actualVsBudgetChartInstance = null;
    let currentVsPastChartInstance = null;
    let productSalesChartInstance = null;
    let budgetDonutChartInstance = null;

    function renderAnalytics() {
        const activeYearBtn = document.querySelector('.year-btn.active');
        const currentYear = activeYearBtn ? parseInt(activeYearBtn.innerText) : new Date().getFullYear();
        const pastYear = currentYear - 1;

        let totalStock = 0;
        let totalRetailVal = 0;
        let totalCostVal = 0;
        let lowStockCount = 0;

        inventory.forEach(p => {
            totalStock += (p.stock || 0);
            totalRetailVal += (p.stock || 0) * (p.price || 0);
            totalCostVal += (p.stock || 0) * (p.costPrice || 0);
            if ((p.stock || 0) <= (p.threshold || 5)) lowStockCount++;
        });

        const totalOverallSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalUnitsSold = sales.reduce((sum, s) => {
            return sum + (s.items || []).reduce((itemSum, item) => itemSum + (item.actualQty || item.qty || item.quantity || 0), 0);
        }, 0);
        const creditSalesOverall = sales.filter(s => s.status !== 'Paid').reduce((sum, s) => sum + ((s.total || 0) - (s.amountPaid || 0)), 0);
        const debtorsTotal = customers.reduce((sum, c) => sum + ((c.totalAmount || 0) - (c.partlyPaid || 0)), 0);
        const expectedProfitOverall = totalRetailVal - totalCostVal;

        // Update Global Cards (restored metrics)
        const updateText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        updateText('anaTotalItems', inventory.length);
        updateText('anaTotalStock', totalStock);
        updateText('anaRetailValue', `₦${totalRetailVal.toLocaleString()}`);
        updateText('anaInvCost', `₦${totalCostVal.toLocaleString()}`);
        updateText('anaTotalSales', `₦${totalOverallSales.toLocaleString()}`);
        updateText('anaTotalUnitsSold', totalUnitsSold);
        updateText('anaExpProfit', `₦${expectedProfitOverall.toLocaleString()}`);
        updateText('anaLowStock', lowStockCount);
        updateText('anaCreditSales', `₦${creditSalesOverall.toLocaleString()}`);
        updateText('anaDebtors', `₦${debtorsTotal.toLocaleString()}`);

        // Calculate Year-Specific Sales Data
        const currentYearSales = sales.filter(s => new Date(s.date).getFullYear() === currentYear);
        const pastYearSales = sales.filter(s => new Date(s.date).getFullYear() === pastYear);

        const totalCurrentYearSales = currentYearSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalPastYearSales = pastYearSales.reduce((sum, s) => sum + (s.total || 0), 0);

        // Budget is simulated (Current Sales * 1.2 or Inventory Value)
        const budgetSales = Math.max(totalRetailVal, totalCurrentYearSales * 1.2);
        const variance = budgetSales > 0 ? ((totalCurrentYearSales - budgetSales) / budgetSales) * 100 : 0;
        const growth = totalPastYearSales > 0 ? ((totalCurrentYearSales - totalPastYearSales) / totalPastYearSales) * 100 : 0;

        // Update Comparative Cards (from image)
        updateText('cardValCurrentSales', `₦${totalCurrentYearSales.toLocaleString()}`);
        updateText('cardValBudgetSales', `₦${budgetSales.toLocaleString()}`);
        updateText('cardValBudgetVariance', `${variance.toFixed(2)}%`);
        updateText('cardValPastSales', `₦${totalPastYearSales.toLocaleString()}`);
        updateText('cardValGrowth', `${growth.toFixed(2)}%`);

        // Render All Charts
        renderActualVsBudgetChart(currentYearSales, budgetSales);
        renderCurrentVsPastChart(currentYearSales, pastYearSales);
        renderProductSalesChart(currentYearSales);
        renderBudgetDonutChart(totalCurrentYearSales, budgetSales);
    }

    // Add event listener for year selector
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('year-btn')) {
            document.querySelectorAll('.year-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderAnalytics(); 
        }
    });

    // Reset Analytics Button
    const resetBtn = document.getElementById('resetAnalyticsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all analytics data? This will clear local records for Sales, Expenses, Customers, and Adjustments.")) {
                console.log("Resetting analytics data...");
                
                // Clear localStorage
                localStorage.removeItem('shayorsSales');
                localStorage.removeItem('shayorsExpenses');
                localStorage.removeItem('shayorsCustomers');
                localStorage.removeItem('shayorsAdjustments');

                // Reset local variables (these must match the 'let' variables at top of DOMContentLoaded)
                sales = [];
                expenses = [];
                customers = [];
                adjustments = [];

                // Re-render
                renderAnalytics();
                
                // Refresh other views if active
                if (document.getElementById('sales-module')?.classList.contains('active')) renderSalesHistory();
                if (document.getElementById('expenses-module')?.classList.contains('active')) renderExpenses();
                if (document.getElementById('customers-module')?.classList.contains('active')) renderCustomers();
                if (document.getElementById('adjustments-module')?.classList.contains('active')) renderAdjustments();

                alert("Analytics data has been reset successfully.");
            }
        });
    }

    function renderActualVsBudgetChart(currentSales, budgetTotal) {
        const canvas = document.getElementById('actualVsBudgetChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (actualVsBudgetChartInstance) actualVsBudgetChartInstance.destroy();

        // Monthly breakdown
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const actualData = new Array(12).fill(0);
        const budgetData = new Array(12).fill(budgetTotal / 12);

        currentSales.forEach(s => {
            const m = new Date(s.date).getMonth();
            actualData[m] += (s.total || 0);
        });

        actualVsBudgetChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Actual Sales',
                        data: actualData,
                        borderColor: '#3a7afe',
                        backgroundColor: 'rgba(58, 122, 254, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Budget Sales',
                        data: budgetData,
                        borderColor: '#17c7d4',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function renderCurrentVsPastChart(currentSales, pastSales) {
        const canvas = document.getElementById('currentVsPastChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (currentVsPastChartInstance) currentVsPastChartInstance.destroy();

        const currentYear = new Date().getFullYear();
        const years = [currentYear - 2, currentYear - 1, currentYear];
        const currentYearTotal = currentSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const pastYearTotal = pastSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const olderYearTotal = pastYearTotal * 0.8; // Simulated

        currentVsPastChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years.map(String),
                datasets: [{
                    label: 'Annual Sales Performance',
                    data: [olderYearTotal, pastYearTotal, currentYearTotal],
                    backgroundColor: ['#f09d38', '#17c7d4', '#3a7afe'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function renderProductSalesChart(currentSales) {
        const canvas = document.getElementById('productSalesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (productSalesChartInstance) productSalesChartInstance.destroy();

        const productTotals = {};
        currentSales.forEach(s => {
            (s.items || []).forEach(item => {
                productTotals[item.name] = (productTotals[item.name] || 0) + (item.total || 0);
            });
        });

        const sortedProducts = Object.entries(productTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        productSalesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedProducts.map(p => p[0]),
                datasets: [{
                    label: 'Actual Sales',
                    data: sortedProducts.map(p => p[1]),
                    backgroundColor: '#3a7afe',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    function renderBudgetDonutChart(actual, budget) {
        const canvas = document.getElementById('budgetDonutChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (budgetDonutChartInstance) budgetDonutChartInstance.destroy();

        const percent = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
        const remaining = 100 - percent;

        const budgetText = document.getElementById('budgetPercentText');
        if (budgetText) budgetText.innerText = `${Math.round(percent)}%`;

        budgetDonutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Achieved', 'Remaining'],
                datasets: [{
                    data: [percent, remaining],
                    backgroundColor: ['#19b38c', '#eeeeee'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }


    // 9. Customers Module
    window.toggleCustomerForm = function() {
        const form = document.getElementById('customerForm');
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
            document.getElementById('cId').value = ''; // Ensure ID is cleared for new entries
            form.reset();
            document.getElementById('cDate').value = new Date().toISOString().split('T')[0];
        }
    };

    async function fetchCustomers() {
        const token = getAdminToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                customers = data.map(c => ({ ...c, id: c._id }));
                renderCustomers();
            }
        } catch (err) { console.error("Fetch customers failed:", err); }
    }

    async function fetchAdjustments() {
        const token = getAdminToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/adjustments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                adjustments = data.map(a => ({ ...a, id: a._id }));
                renderAdjustments();
            }
        } catch (err) { console.error("Fetch adjustments failed:", err); }
    }

    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = getAdminToken();
            const id = document.getElementById('cId').value;
            const custData = {
                date: document.getElementById('cDate').value,
                invoiceNo: document.getElementById('cInvoiceNo').value,
                name: document.getElementById('cName').value,
                contact: document.getElementById('cContact').value,
                product: document.getElementById('cProduct').value,
                totalUnits: parseInt(document.getElementById('cUnits').value) || 1,
                totalAmount: parseFloat(document.getElementById('cTotalAmount').value),
                partlyPaid: parseFloat(document.getElementById('cPartlyPaid').value) || 0,
                dueDate: document.getElementById('cDueDate').value,
                status: document.getElementById('cStatus').value
            };

            try {
                const url = id ? `${API_BASE}/customers/${id}` : `${API_BASE}/customers`;
                const method = id ? 'PATCH' : 'POST';
                const response = await fetch(url, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(custData)
                });

                if (response.ok) {
                    // Propagate status change to Sales and Web Orders
                    await syncStatusToSalesAndOrders(custData.invoiceNo, custData.status);
                    
                    await fetchCustomers();
                    customerForm.reset();
                    toggleCustomerForm();
                    alert(id ? 'Customer updated' : 'Customer added');
                } else {
                    const errorData = await response.json();
                    alert("Save failed: " + (errorData.message || response.statusText));
                }
            } catch (err) { 
                console.error("Customer Save Error:", err);
                alert("Save failed due to a network or connection error"); 
            }
        });
    }

    function renderCustomers(filterData = customers) {
        const body = document.getElementById('customersBody');
        if (!body) return;
        body.innerHTML = '';
        
        filterData.slice().reverse().forEach(c => {
            const balance = (c.totalAmount || 0) - (c.partlyPaid || 0);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.date}<br><small>${c.invoiceNo || 'N/A'}</small></td>
                <td><strong>${c.name}</strong><br><small>${c.contact}</small></td>
                <td>${c.product || 'N/A'}</td>
                <td>${c.totalUnits || 1}</td>
                <td>₦${(c.totalAmount || 0).toLocaleString()}</td>
                <td>₦${(c.partlyPaid || 0).toLocaleString()}</td>
                <td style="color: ${balance > 0 ? '#d9534f' : '#5cb85c'}; font-weight: ${balance > 0 ? 'bold' : 'normal'}">
                    ₦${balance.toLocaleString()}
                    ${balance > 0 ? '<br><small style="color: #d9534f;">Owing</small>' : ''}
                </td>
                <td>${c.dueDate || 'N/A'}</td>
                <td><span class="badge ${c.status === 'Paid' ? 'badge-in' : 'badge-out'}">${c.status}</span></td>
                <td>
                    ${checkPermission('manage_customers') ? `<button class="btn secondary" onclick="editCustomer('${c.id}')">Edit</button>` : ''}
                    ${balance > 0 ? `<button class="btn primary" style="background: #25D366; border: none;" onclick="sendPaymentReminder('${c.id}')">Remind</button>` : ''}
                    ${checkPermission('manage_customers') ? `<button class="btn danger" onclick="deleteCustomer('${c.id}')">Del</button>` : ''}
                </td>
            `;
            body.appendChild(row);
        });
    }

    window.sendPaymentReminder = function(id) {
        const c = customers.find(cust => cust.id === id);
        if (!c) return;
        
        const balance = (c.totalAmount || 0) - (c.partlyPaid || 0);
        if (balance <= 0) return;

        const message = `Hello ${c.name}, this is a friendly reminder from Shayors Cosmetics regarding your outstanding balance of ₦${balance.toLocaleString()} for Invoice ${c.invoiceNo || 'N/A'}. Kindly make payment at your earliest convenience. Thank you!`;
        const encodedMessage = encodeURIComponent(message);
        
        // Try to open WhatsApp
        window.open(`https://wa.me/${c.contact.replace(/\D/g,'')}?text=${encodedMessage}`, '_blank');
    };

    window.editCustomer = function(id) {
        const c = customers.find(cust => cust.id === id);
        if (!c) return;
        document.getElementById('cId').value = c.id;
        document.getElementById('cDate').value = c.date;
        document.getElementById('cInvoiceNo').value = c.invoiceNo || '';
        document.getElementById('cName').value = c.name;
        document.getElementById('cContact').value = c.contact;
        document.getElementById('cProduct').value = c.product || '';
        document.getElementById('cUnits').value = c.totalUnits || 1;
        document.getElementById('cTotalAmount').value = c.totalAmount;
        document.getElementById('cPartlyPaid').value = c.partlyPaid;
        document.getElementById('cDueDate').value = c.dueDate || '';
        document.getElementById('cStatus').value = c.status;
        document.getElementById('customerForm').classList.remove('hidden');
    };

    window.deleteCustomer = function(id) {
        if (confirm('Delete this record?')) {
            const token = getAdminToken();
            fetch(`${API_BASE}/customers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (res.ok) fetchCustomers();
            });
        }
    };

    window.searchCustomers = function() {
        const term = document.getElementById('customerSearch').value.toLowerCase();
        const filtered = customers.filter(c => 
            c.name.toLowerCase().includes(term) || 
            (c.contact && c.contact.toLowerCase().includes(term)) ||
            (c.invoiceNo && c.invoiceNo.toLowerCase().includes(term))
        );
        renderCustomers(filtered);
    };

    function renderSuppliers() {
        const body = document.getElementById('suppliersBody');
        if (!body) return;
        body.innerHTML = '';
        suppliers.forEach((s, idx) => {
            body.innerHTML += `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.contact}</td>
                    <td>${s.address || 'N/A'}</td>
                    <td>${s.products}</td>
                    <td><button class="btn danger" onclick="deleteSupplier(${idx})">Del</button></td>
                </tr>`;
        });
    }

    window.toggleSupplierForm = function() {
        document.getElementById('supplierForm').classList.toggle('hidden');
    };

    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
        supplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sup = {
                name: document.getElementById('supName').value,
                contact: document.getElementById('supContact').value,
                address: document.getElementById('supAddress').value,
                products: document.getElementById('supProducts').value
            };
            suppliers.push(sup);
            localStorage.setItem('shayorsSuppliers', JSON.stringify(suppliers));
            renderSuppliers();
            supplierForm.reset();
            toggleSupplierForm();
        });
    }

    window.deleteSupplier = function(idx) {
        if (confirm('Delete this supplier?')) {
            suppliers.splice(idx, 1);
            localStorage.setItem('shayorsSuppliers', JSON.stringify(suppliers));
            renderSuppliers();
        }
    };

    function renderStore() {
        renderStaff();
        renderRoles();
        renderCategoryManager();
        renderSpaCategoryManager();
        renderExpenseCategoriesManager();
    }

    async function fetchStaff() {
        const token = getAdminToken();
        if (!token) return;

        try {
            const res = await fetchWithTimeout(`${API_BASE}/admin/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const backendStaff = await res.json();
                
                staff = backendStaff;
                localStorage.setItem('shayorsStaff', JSON.stringify(staff));
                renderStaff();
            }
        } catch (err) {
            console.error("Failed to fetch staff:", err);
        }
    }

    function renderStaff() {
        const list = document.getElementById('staffList');
        if (!list) return;
        list.innerHTML = '';
        staff.forEach((s) => {
            const isMaster = s.isMaster || s.role === 'Master Admin';
            list.innerHTML += `
                <li class="zuru-item" style="${isMaster ? 'border-left: 4px solid #d4af37;' : ''}">
                    <div class="zuru-item-info">
                        <strong>${s.email} ${isMaster ? '⭐' : ''}</strong>
                        <small>${s.role} ${s.isActivated ? '' : '(Pending)'}</small>
                    </div>
                    <div class="zuru-item-actions">
                        ${(!s.isActivated && checkPermission('manage_staff')) ? `<button class="btn primary btn-xs" onclick="resendInvite('${s.email}', '${s.role}')" style="margin-right: 5px;">Resend</button>` : ''}
                        ${(!isMaster && checkPermission('remove_store_staff')) ? `<button class="btn danger btn-xs" onclick="deleteStaff('${s._id}')">Remove</button>` : ''}
                    </div>
                </li>`;
        });
    }

    window.resendAllPendingInvites = async function() {
        if (!confirm("This will send a fresh invitation email to all staff members who haven't joined yet. Continue?")) return;
        
        const adminToken = getAdminToken();
        try {
            const response = await fetch(`${API_BASE}/admin/resend-all`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();
            alert(data.message);
            await fetchStaff();
        } catch (error) {
            console.error("Resend all failed:", error);
            alert("Failed to resend invitations.");
        }
    };

    window.resendInvite = async function(email, role) {
        const adminToken = getAdminToken();
        try {
            const response = await fetch(`${API_BASE}/admin/invite`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ email, role })
            });

            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                await fetchStaff();
            }
        } catch (error) {
            console.error("Resend failed:", error);
            alert("Failed to resend invitation.");
        }
    };

    async function fetchRoles() {
        const token = getAdminToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/admin/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const backendRoles = await res.json();
                if (backendRoles.length > 0) {
                    roles = backendRoles;
                    localStorage.setItem('shayorsRoles', JSON.stringify(roles));
                    renderRoles();
                    updateStaffRoleDropdown();
                }
            }
        } catch (err) {
            console.error("Failed to fetch roles:", err);
        }
    }

    function renderRoles() {
        const list = document.getElementById('rolesList');
        if (!list) return;
        list.innerHTML = '';
        roles.forEach((r) => {
            list.innerHTML += `
                <li class="zuru-item">
                    <div class="zuru-item-info">
                        <strong>${r.name}</strong>
                        <p><small>${r.permissions.join(', ')}</small></p>
                    </div>
                    ${(r.name !== 'Admin' && checkPermission('create_store_role')) ? `<button class="btn danger btn-xs" onclick="deleteRole('${r._id || r.name}')">Delete</button>` : ''}
                </li>`;
        });
    }

    window.toggleRoleForm = function() {
        const form = document.getElementById('roleForm');
        const list = document.getElementById('rolesListContainer');
        form.classList.toggle('hidden');
        list.classList.toggle('hidden');
    };

    const roleForm = document.getElementById('roleForm');
    if (roleForm) {
        roleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const checked = Array.from(roleForm.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            const name = document.getElementById('roleName').value;
            const r = { name, permissions: checked };
            
            const adminToken = getAdminToken();
            try {
                const response = await fetch(`${API_BASE}/admin/roles`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify(r)
                });
                if (response.ok) {
                    await fetchRoles();
                    roleForm.reset();
                    toggleRoleForm();
                } else {
                    const data = await response.json();
                    alert(data.message || "Failed to create role");
                    roles.push(r);
                    localStorage.setItem('shayorsRoles', JSON.stringify(roles));
                    renderRoles();
                    updateStaffRoleDropdown();
                }
            } catch (err) {
                console.error("Role creation error:", err);
                roles.push(r);
                localStorage.setItem('shayorsRoles', JSON.stringify(roles));
                renderRoles();
                updateStaffRoleDropdown();
            }
        });
    }

    function updateStaffRoleDropdown() {
        const select = document.getElementById('staffRole');
        if (!select) return;
        select.innerHTML = '<option value="">Select Role...</option>';
        roles.forEach(r => {
            select.innerHTML += `<option value="${r.name}">${r.name}</option>`;
        });
    }

    window.toggleStaffForm = function() {
        const form = document.getElementById('staffForm');
        const list = document.getElementById('staffListContainer');
        const header = form.closest('.admin-card').querySelector('h2');
        
        form.classList.toggle('hidden');
        list.classList.toggle('hidden');
        
        if (!form.classList.contains('hidden')) {
            header.innerText = 'Add Staff';
        } else {
            header.innerText = 'Staff Management';
        }
    };

    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('staffEmail').value;
            const role = document.getElementById('staffRole').value;
            const adminToken = getAdminToken();

            // Check if staff already exists in local list
            const existingStaff = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
            if (existingStaff) {
                if (existingStaff.isActivated) {
                    alert("This staff member is already active in the system.");
                    return;
                } else {
                    if (confirm("This staff member has a pending invitation. Would you like to resend it?")) {
                        resendInvite(email, role);
                        staffForm.reset();
                        toggleStaffForm();
                        return;
                    }
                }
            }

            try {
                const response = await fetch(`${API_BASE}/admin/invite`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ email, role })
                });

                const data = await response.json();
                alert(data.message);
                
                if (response.ok) {
                    // Refresh list from server
                    await fetchStaff();
                    staffForm.reset();
                    toggleStaffForm();
                }
            } catch (error) {
                console.error("Invite failed:", error);
                alert("Failed to send invitation.");
            }
        });
    }

    window.deleteStaff = async function(id) {
        if (confirm('Delete this staff member?')) {
            const token = getAdminToken();
            try {
                // Optimistic UI update
                staff = staff.filter(s => s._id !== id);
                localStorage.setItem('shayorsStaff', JSON.stringify(staff));
                renderStaff();

                const res = await fetch(`${API_BASE}/admin/staff/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) {
                    const data = await res.json();
                    alert(data.message || 'Failed to delete staff');
                    // Rollback if failed
                    await fetchStaff();
                }
            } catch (err) {
                console.error("Delete failed:", err);
                await fetchStaff();
            }
        }
    };

    window.deleteRole = async function(idOrName) {
        if (!confirm('Delete this role?')) return;

        const adminToken = getAdminToken();
        // If it's a MongoDB ID
        if (idOrName && idOrName.length === 24) {
            try {
                const res = await fetch(`${API_BASE}/admin/roles/${idOrName}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${adminToken}` }
                });
                if (res.ok) {
                    await fetchRoles();
                    return;
                }
            } catch (err) {
                console.error("Role deletion error:", err);
            }
        }
        
        // Fallback or Local-only deletion
        roles = roles.filter(r => (r._id !== idOrName && r.name !== idOrName));
        localStorage.setItem('shayorsRoles', JSON.stringify(roles));
        renderRoles();
        updateStaffRoleDropdown();
    };

    // 10. Stock Adjustments logic
    window.toggleAdjustmentForm = function() {
        document.getElementById('adjustmentForm').classList.toggle('hidden');
    };

    function updateAdjustmentProductDropdown() {
        const select = document.getElementById('adjProduct');
        if (!select) return;
        select.innerHTML = '<option value="">Select Product...</option>';
        inventory.forEach(p => {
            select.innerHTML += `<option value="${p._id}">${p.name}</option>`;
        });
    }

    const adjustmentForm = document.getElementById('adjustmentForm');
    if (adjustmentForm) {
        adjustmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('adjProduct').value;
            const type = document.getElementById('adjType').value;
            const qty = parseInt(document.getElementById('adjQty').value);
            const reason = document.getElementById('adjReason').value;

            const product = inventory.find(p => p._id === productId);
            if (product) {
                const newStock = type === 'Restock' ? product.stock + qty : Math.max(0, product.stock - qty);
                const adminToken = getAdminToken();

                try {
                    // 1. Update Product Stock
                    const stockRes = await fetch(`${API_BASE}/products/${productId}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({ stock: newStock })
                    });

                    if (stockRes.ok) {
                        // 2. Create Adjustment Record in Backend
                        await fetch(`${API_BASE}/adjustments`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminToken}`
                            },
                            body: JSON.stringify({ productId, productName: product.name, type, qty, reason })
                        });

                        product.stock = newStock;
                        await fetchAdjustments();
                        renderInventory();
                        adjustmentForm.reset();
                        toggleAdjustmentForm();
                        alert('Stock adjusted and synced.');
                    } else {
                        const err = await stockRes.json();
                        alert(`Adjustment failed: ${err.message}`);
                    }
                } catch (error) {
                    console.error("Adjustment sync failed:", error);
                    alert("Could not connect to server.");
                }
            }
        });
    }

    function renderAdjustments() {
        const body = document.getElementById('adjustmentsBody');
        if (!body) return;
        body.innerHTML = '';
        adjustments.slice().reverse().forEach(a => {
            body.innerHTML += `
                <tr>
                    <td>${new Date(a.date).toLocaleDateString()}</td>
                    <td>${a.productName}</td>
                    <td><span class="badge ${a.type === 'Restock' ? 'badge-in' : 'badge-out'}">${a.type}</span></td>
                    <td>${a.qty}</td>
                    <td>${a.reason}</td>
                </tr>`;
        });
    }

    window.toggleSpaForm = function() {
        document.getElementById('spaForm').classList.toggle('hidden');
        if (document.getElementById('spaForm').classList.contains('hidden')) {
            document.getElementById('spaForm').reset();
            document.getElementById('spaId').value = '';
            const preview = document.getElementById('spaImagePreview');
            if (preview) {
                preview.src = '';
                preview.classList.add('hidden');
            }
        }
    };

    window.previewSpaImage = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 1000;

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                
                const preview = document.getElementById('spaImagePreview');
                preview.src = compressedDataUrl;
                preview.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    async function renderSpaServices() {
        const spaBody = document.getElementById('spaBody');
        const bookingsBody = document.getElementById('bookingsBody');
        if (!spaBody || !bookingsBody) return;

        try {
            // Fetch Services
            const sRes = await fetchWithTimeout(`${API_BASE}/services`);
            if (sRes.ok) {
                const services = await sRes.json();
                spaBody.innerHTML = '';
                services.forEach(s => {
                    spaBody.innerHTML += `
                        <tr>
                            <td><img src="${s.image || '../Image/spa-service.png'}" class="prod-img-small" onerror="this.src='../Image/placeholder.png'"></td>
                            <td>${s.name}</td>
                            <td>${s.category}</td>
                            <td>₦${s.price.toLocaleString()}</td>
                            <td>${s.units}</td>
                            <td>
                                <button class="btn secondary" onclick="editSpa('${s._id}')">Edit</button>
                                <button class="btn danger" onclick="deleteSpa('${s._id}')">Del</button>
                            </td>
                        </tr>
                    `;
                });
            }

            // Fetch Bookings
            const bRes = await fetchWithTimeout(`${API_BASE}/bookings`, {
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            if (bRes.ok) {
                const bookings = await bRes.json();
                bookingsBody.innerHTML = '';
                bookings.forEach(b => {
                    const bookingDateTime = b.date && b.time ? `${b.date} at ${b.time}` : new Date(b.createdAt).toLocaleDateString();
                    bookingsBody.innerHTML += `
                        <tr>
                            <td>${bookingDateTime}</td>
                            <td>${b.serviceName}</td>
                            <td>${b.customerName}</td>
                            <td>${b.customerContact}</td>
                            <td>${b.note || ''}</td>
                            <td><button class="btn danger" onclick="deleteBooking('${b._id}')">Del</button></td>
                        </tr>
                    `;
                });
            }
        } catch (e) { console.error(e); }
    }

    document.getElementById('spaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('spaId').value;
        const data = {
            name: document.getElementById('spaName').value,
            category: document.getElementById('spaCategory').value,
            units: document.getElementById('spaUnits').value,
            price: parseFloat(document.getElementById('spaPrice').value),
            image: document.getElementById('spaImagePreview').src
        };

        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/services${id ? '/' + id : ''}`, {
                method: id ? 'PATCH' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                toggleSpaForm();
                renderSpaServices();
            }
        } catch (e) { console.error(e); }
    });

    window.editSpa = async function(id) {
        try {
            const res = await fetch(`${API_BASE}/services`);
            const services = await res.json();
            const s = services.find(x => x._id === id);
            if (s) {
                document.getElementById('spaId').value = s._id;
                document.getElementById('spaName').value = s.name;
                document.getElementById('spaCategory').value = s.category;
                document.getElementById('spaUnits').value = s.units;
                document.getElementById('spaPrice').value = s.price;
                
                const preview = document.getElementById('spaImagePreview');
                if (s.image) {
                    preview.src = s.image;
                    preview.classList.remove('hidden');
                } else {
                    preview.src = '';
                    preview.classList.add('hidden');
                }

                document.getElementById('spaForm').classList.remove('hidden');
            }
        } catch (e) { console.error(e); }
    };

    window.deleteSpa = async function(id) {
        if (!confirm('Delete this service?')) return;
        try {
            await fetch(`${API_BASE}/services/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            renderSpaServices();
        } catch (e) { console.error(e); }
    };

    window.deleteBooking = async function(id) {
        if (!confirm('Delete this booking?')) return;
        try {
            await fetch(`${API_BASE}/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            renderSpaServices();
        } catch (e) { console.error(e); }
    };

    // --- REAL-TIME NOTIFICATIONS ---
    let lastOrderCount = 0;
    
    async function checkNewOrders() {
        const token = getAdminToken();
        if (!token || token === "null" || token === "undefined" || token.length < 20) return;

        try {
            const response = await fetchWithTimeout(`${API_BASE}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const orders = data.orders;
                
                if (lastOrderCount === 0) {
                    lastOrderCount = orders.length;
                } else if (orders.length > lastOrderCount) {
                    const diff = orders.length - lastOrderCount;
                    lastOrderCount = orders.length;
                    showOrderAlert(diff);
                    if (document.getElementById('sales-module').classList.contains('active')) {
                        renderSalesHistory();
                    }
                }
            }
        } catch (e) { console.error("Poll error:", e); }
    }

    function showOrderAlert(count) {
        // Create alert overlay
        const alertDiv = document.createElement('div');
        alertDiv.className = 'order-notification-alert';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">🔔</span>
                <div class="alert-text">
                    <strong>New Order Received!</strong>
                    <p>You have ${count} new order(s) to process.</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove(); showModule('sales')">View Now</button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        // Play sound if possible (optional)
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch (e) {}

        // Remove after 10 seconds
        setTimeout(() => { if (alertDiv.parentElement) alertDiv.remove(); }, 10000);
    }

    // Start polling every 30 seconds
    setInterval(checkNewOrders, 30000);

    // Category Management Functions
    async function fetchCategories() {
        console.log("Fetching categories...");
        try {
            const response = await fetchWithTimeout(`${API_BASE}/categories`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    categories = data;
                    localStorage.setItem('shayorsCategories', JSON.stringify(categories));
                }
                console.log("Categories loaded:", categories);
                updateCategoryDropdowns();
                renderCategoryManager();
            } else {
                // If API fails, we still have our local 'categories' array from line 68
                updateCategoryDropdowns();
                renderCategoryManager();
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to local
            updateCategoryDropdowns();
            renderCategoryManager();
        }
    }

    function updateCategoryDropdowns() {
        const pCategory = document.getElementById('pCategory');
        if (pCategory) {
            const currentVal = pCategory.value;
            pCategory.innerHTML = categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('') + '<option value="Other">Other</option>';
            if (currentVal) pCategory.value = currentVal;
        }
    }

    function renderCategoryManager() {
        const container = document.getElementById('categoriesManager');
        if (!container) return;
        
        if (categories.length === 0) {
            container.innerHTML = '<p style="font-size: 0.8rem; color: #888;">No categories found.</p>';
            return;
        }

        container.innerHTML = categories.map(cat => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span style="font-size: 0.9rem;">${cat.name}</span>
                <button onclick="deleteCategory('${cat._id}')" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.8rem;">Delete</button>
            </div>
        `).join('');
    }

    window.addCategory = async function() {
        const nameInput = document.getElementById('newCatName');
        const name = nameInput.value.trim();
        if (!name) return alert("Please enter a category name");

        // Try API first
        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAdminToken()}`
                },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                nameInput.value = '';
                fetchCategories();
                return;
            }
        } catch (error) {
            console.warn("API Add failed, falling back to local storage:", error);
        }

        // Local Storage Fallback
        const newCat = { name, _id: 'local_' + Math.random().toString(36).substr(2, 9) };
        categories.push(newCat);
        localStorage.setItem('shayorsCategories', JSON.stringify(categories));
        nameInput.value = '';
        updateCategoryDropdowns();
        renderCategoryManager();
        alert("Category added locally (Will sync with server after redeploy)");
    };

    window.deleteCategory = async function(id) {
        if (!confirm("Are you sure you want to delete this category? Products in this category will NOT be deleted, but they will lose their category assignment.")) return;

        // Try API first
        try {
            const response = await fetch(`${API_BASE}/categories/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${getAdminToken()}`
                }
            });

            if (response.ok) {
                fetchCategories();
                return;
            }
        } catch (error) {
            console.warn("API Delete failed, falling back to local storage:", error);
        }

        // Local Storage Fallback
        categories = categories.filter(cat => cat._id !== id);
        localStorage.setItem('shayorsCategories', JSON.stringify(categories));
        updateCategoryDropdowns();
        renderCategoryManager();
        alert("Category removed locally");
    };

    // --- SPA CATEGORY MANAGEMENT ---

    async function fetchSpaCategories() {
        console.log("Fetching spa categories...");
        // For now, we use local storage as primary until backend support is added
        // but we structure it like fetchCategories for future sync
        updateSpaCategoryDropdowns();
        renderSpaCategoryManager();
    }

    function updateSpaCategoryDropdowns() {
        const spaCategory = document.getElementById('spaCategory');
        if (spaCategory) {
            const currentVal = spaCategory.value;
            // Ensure spaCategories is an array
            const cats = Array.isArray(spaCategories) ? spaCategories : [];
            spaCategory.innerHTML = '<option value="">Select Category...</option>' + 
                cats.map(cat => `<option value="${cat.name || ''}">${cat.name || 'Unknown'}</option>`).join('');
            if (currentVal) spaCategory.value = currentVal;
        }
    }

    function renderSpaCategoryManager() {
        const container = document.getElementById('spaCategoriesManager');
        if (!container) return;
        
        if (spaCategories.length === 0) {
            container.innerHTML = '<p style="font-size: 0.8rem; color: #888;">No spa categories found.</p>';
            return;
        }

        container.innerHTML = spaCategories.map(cat => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span style="font-size: 0.9rem;">${cat.name}</span>
                <button onclick="deleteSpaCategory('${cat._id}')" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 0.8rem;">Delete</button>
            </div>
        `).join('');
    }

    window.addSpaCategory = function() {
        const nameInput = document.getElementById('newSpaCatName');
        const name = nameInput.value.trim();
        if (!name) return alert("Please enter a category name");

        const newCat = { name, _id: 'spa_' + Math.random().toString(36).substr(2, 9) };
        spaCategories.push(newCat);
        localStorage.setItem('shayorsSpaCategories', JSON.stringify(spaCategories));
        nameInput.value = '';
        updateSpaCategoryDropdowns();
        renderSpaCategoryManager();
    };

    window.deleteSpaCategory = function(id) {
        if (!confirm("Delete this spa category?")) return;
        spaCategories = spaCategories.filter(cat => cat._id !== id);
        localStorage.setItem('shayorsSpaCategories', JSON.stringify(spaCategories));
        updateSpaCategoryDropdowns();
        renderSpaCategoryManager();
    };

    function renderExpenseCategoriesManager() {
        const manager = document.getElementById('expenseCategoriesManager');
        const expSelect = document.getElementById('expCategory');
        const costSelect = document.getElementById('costCategory');
        if (!manager) return;

        manager.innerHTML = expenseCategories.map(cat => `
            <div class="cat-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; font-size: 0.9rem;">
                <span>${cat.name}</span>
                <button class="btn-text danger" onclick="deleteExpenseCategory('${cat._id}')" style="font-size: 0.8rem;">Delete</button>
            </div>
        `).join('') || '<p style="font-size: 0.8rem; color: #888; text-align: center;">No categories added</p>';

        const optionsHtml = '<option value="">Category...</option>' + 
            expenseCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');

        if (expSelect) {
            const currentVal = expSelect.value;
            expSelect.innerHTML = optionsHtml;
            expSelect.value = currentVal;
        }
        if (costSelect) {
            const currentVal = costSelect.value;
            costSelect.innerHTML = optionsHtml;
            costSelect.value = currentVal;
        }
    }

    async function fetchExpenseCategories() {
        const token = getAdminToken();
        try {
            const res = await fetchWithTimeout(`${API_BASE}/expense-categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                let data = await res.json();
                
                // Seed defaults if database is empty
                if (data.length === 0) {
                    const defaults = ["Rent", "Salaries", "Raw Materials", "Utility", "Logistics", "Advertising", "Maintenance", "Tax", "Other"];
                    for (const name of defaults) {
                        await fetch(`${API_BASE}/expense-categories`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ name })
                        });
                    }
                    // Re-fetch after seeding
                    const reRes = await fetch(`${API_BASE}/expense-categories`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (reRes.ok) data = await reRes.json();
                }

                expenseCategories = data;
                localStorage.setItem('shayorsExpenseCategories', JSON.stringify(expenseCategories));
            }
        } catch (err) {
            console.error("Fetch expense categories failed", err);
        }
        renderExpenseCategoriesManager();
    }

    window.addExpenseCategory = async function() {
        const nameInput = document.getElementById('newExpCatName');
        const name = nameInput.value.trim();
        if (!name) return alert("Enter a category name");

        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/expense-categories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                nameInput.value = '';
                await fetchExpenseCategories();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to add category");
            }
        } catch (err) {
            console.error("Add expense category error", err);
            alert("An error occurred");
        }
    };

    window.deleteExpenseCategory = async function(id) {
        if (!confirm("Are you sure you want to delete this category?")) return;
        if (id.startsWith('local_')) {
            expenseCategories = expenseCategories.filter(c => c._id !== id);
            localStorage.setItem('shayorsExpenseCategories', JSON.stringify(expenseCategories));
            renderExpenseCategoriesManager();
            return;
        }

        const token = getAdminToken();
        try {
            const res = await fetch(`${API_BASE}/expense-categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchExpenseCategories();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to delete category");
            }
        } catch (err) {
            console.error("Delete expense category error", err);
            alert("An error occurred");
        }
    };

    window.renderRecentPosTransactions = function() {
        const historyContainer = document.getElementById('posRecentTransactions');
        if (!historyContainer) return;

        // Sort by date descending (newest first)
        const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Get last 8 sales for horizontal display
        const recentSales = sortedSales.slice(0, 8);
        
        if (recentSales.length === 0) {
            historyContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:10px; font-size: 0.8rem;">No recent transactions</p>';
            return;
        }

        historyContainer.innerHTML = recentSales.map(s => {
            const dateStr = s.date || s.createdAt;
            const date = dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---';
            
            let itemsText = 'No items';
            if (Array.isArray(s.items)) {
                itemsText = s.items.map(i => `${i.qty || i.quantity || 1}x ${i.name || i.productName}`).join(', ');
            }
            
            return `
                <div class="mini-history-item">
                    <div class="header">
                        <span>#${(s._id || s.apiId || s.id || '').toString().slice(-4).toUpperCase()}</span>
                        <span>${date}</span>
                    </div>
                    <div class="details" title="${itemsText}">
                        <strong>${s.customerName || s.customer || 'Walk-in'}</strong><br>
                        ${itemsText}
                    </div>
                    <div class="total">₦${parseFloat(s.total || s.totalAmount || 0).toLocaleString()}</div>
                    <div class="actions">
                        <button class="btn secondary btn-mini" onclick='showReceipt(${JSON.stringify(s).replace(/'/g, "&apos;")})'>View</button>
                        <button class="btn primary btn-mini" onclick='showReceipt(${JSON.stringify(s).replace(/'/g, "&apos;")})'>Print</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Initialize
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam) {
        showModule(moduleParam);
    } else {
        renderInventory();
    }

    init();
});
