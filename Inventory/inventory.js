document.addEventListener('DOMContentLoaded', () => {
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.');

    // SET THIS TO TRUE to use the LIVE server data while working locally
    const USE_LIVE_DATA_LOCALLY = true;

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

    function checkPermission(perm) {
        const loggedInStaffId = sessionStorage.getItem('shayorsStaffId') || localStorage.getItem('shayorsStaffId');
        if (!loggedInStaffId) return true; // Default to admin/all if not a specific staff login
        
        const currentStaff = staff.find(s => s.id == loggedInStaffId);
        if (!currentStaff) return false;
        
        const currentRole = roles.find(r => r.name === currentStaff.role);
        if (!currentRole) return false;
        
        return currentRole.permissions.includes('all') || currentRole.permissions.includes(perm);
    }

    function enforcePermissions() {
        const sidebarItems = document.querySelectorAll('.sidebar-nav li');
        
        sidebarItems.forEach(item => {
            const module = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (!module) return;
            
            let permissionNeeded = '';
            switch(module) {
                case 'inventory': permissionNeeded = 'view_inventory'; break;
                case 'sales': permissionNeeded = 'record_sale'; break;
                case 'expenses': permissionNeeded = 'view_records'; break;
                case 'analytics': permissionNeeded = 'view_store_analytics'; break;
                case 'spa': permissionNeeded = 'view_records'; break;
                case 'adjustments': permissionNeeded = 'record_stock_out'; break;
                case 'customers': permissionNeeded = 'view_customers'; break;
                case 'suppliers': permissionNeeded = 'manage_suppliers'; break;
                case 'store': permissionNeeded = 'manage_settings'; break;
            }
            
            if (permissionNeeded && !checkPermission(permissionNeeded)) {
                item.style.display = 'none';
            } else {
                item.style.display = 'block';
            }
        });
    }

    // reconciliation between API and localStorage
    async function syncSalesWithAPI() {
        const token = getAdminToken();
        if (!token) return;

        try {
            const [ordersRes, bookingsRes] = await Promise.all([
                fetch(`${API_BASE}/orders?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                const apiOrders = data.orders || [];
                
                let localSales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                let modified = false;

                apiOrders.forEach(order => {
                    const exists = localSales.find(s => s.apiId === order._id || s.id === order._id);
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
                            status: order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus === 'partly paid' ? 'Partly Paid' : 'Unpaid'),
                            paymentMethod: order.paymentMethod,
                            amountPaid: order.paymentStatus === 'paid' ? order.totalAmount : 0,
                            platform: order.platform || 'Web Store',
                            type: 'product'
                        });
                        modified = true;
                    }
                });

                if (modified) {
                    sales = localSales;
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));
                }
            }
            
            if (bookingsRes.ok) {
                const apiBookings = await bookingsRes.json();
                let localSales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
                let modified = false;

                apiBookings.forEach(booking => {
                    const exists = localSales.find(s => s.apiId === booking._id || s.id === booking._id);
                    if (!exists) {
                        localSales.push({
                            id: booking._id,
                            apiId: booking._id,
                            date: booking.createdAt,
                            customer: booking.customerName,
                            contact: booking.customerContact,
                            items: [{ name: booking.serviceName, qty: 1, price: 0, type: 'spa' }], // price might be 0 if not stored in booking
                            total: 0, // Bookings might not have price in the base object
                            status: 'Paid',
                            platform: 'WhatsApp',
                            type: 'spa'
                        });
                        modified = true;
                    }
                });

                if (modified) {
                    sales = localSales;
                    localStorage.setItem('shayorsSales', JSON.stringify(sales));
                }
            }
        } catch (error) {
            console.error("Sync Sales Error:", error);
        }
    }

    // 0. Admin Authentication
    async function init() {
        let token = getAdminToken();
        
        if (!token) {
            toggleAuthVisibility(false);
            showLoginModal();
        } else {
            toggleAuthVisibility(true);
            await fetchInventory();
            await fetchSpaCategories();
            await syncSalesWithAPI();
            enforcePermissions();
        }
    }

    function toggleAuthVisibility(isLoggedIn) {
        const appWrapper = document.getElementById('adminAppWrapper');
        const brandsBar = document.getElementById('adminBrandsBar');
        const statusContainer = document.getElementById('adminStatusContainer');
        const loginContainer = document.getElementById('loginModalContainer');

        if (isLoggedIn) {
            appWrapper?.classList.remove('auth-hidden');
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
                <div class="modal-content" style="text-align: center;">
                    <img src="../Image/Shayor's Cosmetics .png" width="150" style="margin-bottom: 20px;">
                    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Admin Login</h2>
                    <form id="loginForm">
                        <input type="password" id="adminPass" placeholder="Enter Admin Password" required 
                               style="width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <div style="text-align: left; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="rememberMe" style="width: 18px; height: 18px; cursor: pointer;">
                            <label for="rememberMe" style="font-size: 0.9rem; color: #555; cursor: pointer;">Remember Me</label>
                        </div>
                        <button type="submit" class="btn primary" style="width: 100%; padding: 12px; border-radius: 5px;">Login to Dashboard</button>
                    </form>
                    <p style="margin-top: 20px;"><a href="../index.html" style="color: #888; text-decoration: none; font-size: 0.85rem;">← Back to Home</a></p>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPass').value;
            const remember = document.getElementById('rememberMe').checked;

            try {
                const response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('shayorsAdminToken', data.token);
                    if (remember) {
                        localStorage.setItem('shayorsAdminToken', data.token);
                    }
                    toggleAuthVisibility(true);
                    fetchInventory();
                } else if (response.status === 503) {
                    alert("Server is waking up, please wait a minute and try again...");
                } else {
                    alert("Access Denied! Invalid Password.");
                }
            } catch (error) {
                console.error("Login failed:", error);
                alert("Server is waking up, please wait a minute and try again...");
            }
        });
    }

    window.logoutAdmin = function() {
        if (confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem('shayorsAdminToken');
            localStorage.removeItem('shayorsAdminToken');
            localStorage.removeItem('inventoryLoggedIn');
            window.location.reload();
        }
    };

    init();

    // 1. Core Data Structures
    let inventory = [];
    let sales = JSON.parse(localStorage.getItem('shayorsSales')) || [];
    let expenses = JSON.parse(localStorage.getItem('shayorsExpenses')) || [];
    let customers = JSON.parse(localStorage.getItem('shayorsCustomers')) || [];
    let suppliers = JSON.parse(localStorage.getItem('shayorsSuppliers')) || [];
    let staff = JSON.parse(localStorage.getItem('shayorsStaff')) || [{id: 1, name: 'Admin', role: 'Admin', email: 'admin@shayors.com'}];
    let roles = JSON.parse(localStorage.getItem('shayorsRoles')) || [{name: 'Admin', permissions: ['all']}];
    let adjustments = JSON.parse(localStorage.getItem('shayorsAdjustments')) || [];
    let spaServices = JSON.parse(localStorage.getItem('shayorsSpaServices')) || [];
    const initialSpaCategories = [{ name: "Salon & Beauty", _id: "spa1" }, { name: "Spa and Wellness", _id: "spa2" }, { name: "Massage", _id: "spa3" }];
    let spaCategories = JSON.parse(localStorage.getItem('shayorsSpaCategories')) || initialSpaCategories;
    const initialCategoriesList = ["Scrub", "Black soap", "Lotion", "Tube", "Oil", "Serum", "Bar soap", "Cleanser", "Toner", "Perfume oil", "Airfreshner", "Gift box", "Tea", "Facesoap", "Body spray", "Roll on", "Lubricant", "Sponge", "Haircare", "Aphrodisiacs", "Cotton pad", "Wipes"];
    let categories = JSON.parse(localStorage.getItem('shayorsCategories')) || initialCategoriesList.map(name => ({ name, _id: 'local_' + Math.random().toString(36).substr(2, 9) }));

    let currentSaleItems = [];

    // Fetch Inventory from Backend
    async function fetchInventory() {
        try {
            await fetchCategories(); // Also fetch categories
            const response = await fetch(`${API_BASE}/products`);
            if (response.ok) {
                const apiData = await response.json();
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

        if (moduleId === 'inventory') renderInventory();
        if (moduleId === 'sales') { syncSalesWithAPI().then(() => { renderSalesHistory(); updateSaleProductDropdown(); }); }
        if (moduleId === 'expenses') renderExpenses();
        if (moduleId === 'analytics') { syncSalesWithAPI().then(() => renderAnalytics()); }
        if (moduleId === 'spa') renderSpaServices();
        if (moduleId === 'adjustments') { renderAdjustments(); updateAdjustmentProductDropdown(); }
        if (moduleId === 'customers') renderCustomers();
        if (moduleId === 'suppliers') renderSuppliers();
        if (moduleId === 'store') { renderStore(); updateStaffRoleDropdown(); fetchCategories(); }
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
        let lowStockCount = 0;

        filterData.forEach(p => {
            const threshold = p.threshold || 5;
            const status = p.stock === 0 ? 'Out of Stock' : (p.stock <= threshold ? 'Low Stock' : 'In Stock');
            const badgeClass = p.stock === 0 ? 'badge-out' : (p.stock <= threshold ? 'badge-low' : 'badge-in');
            
            totalValue += (p.price || 0) * (p.stock || 0);
            if (p.stock <= threshold) lowStockCount++;

            const row = document.createElement('tr');
            row.id = `product-${p._id}`;
            row.innerHTML = `
                <td><img src="${p.image || '../Image/Shayor\'s Logo.png'}" class="prod-img-small"></td>
                <td class="prod-info-cell">
                    <h4>${p.name}</h4>
                    <p>${p.brand} | ${p.size} ${p.shade && p.shade !== 'N/A' ? '| ' + p.shade : ''}</p>
                    <p><small>${p.primaryUnit || ''} ${p.secondaryUnit ? '(' + p.secondaryUnit + ')' : ''} | Barcode: ${p.barcode || 'N/A'}</small></p>
                </td>
                <td>
                    <small>Cost: ₦${(p.costPrice || 0).toLocaleString()}</small><br>
                    <strong>Retail: ₦${(p.price || 0).toLocaleString()}</strong>
                </td>
                <td>
                    <div class="stock-control">
                        <button onclick="updateStock('${p._id}', -1)">-</button>
                        <input type="number" value="${p.stock}" onchange="setStock('${p._id}', this.value)">
                        <button onclick="updateStock('${p._id}', 1)">+</button>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td>
                    <button class="btn secondary" onclick="editProduct('${p._id}')">Edit</button>
                    <button class="btn danger" onclick="deleteProduct('${p._id}')">Del</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });

        document.getElementById('totalProducts').innerText = filterData.length;
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
            renderCurrentSaleList();
            document.getElementById('saleCustomerName').value = '';
            document.getElementById('saleCustomerContact').value = '';
            document.getElementById('saleNote').value = '';
            document.getElementById('saleDiscount').value = 0;
            document.getElementById('saleCharges').value = 0;
            document.getElementById('saleAmountPaid').value = '';
        }
    };

    function updateSaleProductDropdown() {
        const select = document.getElementById('saleProduct');
        if (!select) return;
        select.innerHTML = '<option value="">Select Product...</option>';
        inventory.forEach(p => {
            select.innerHTML += `<option value="${p._id}">${p.name} (${p.stock} left)</option>`;
        });
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
    };

    function renderCurrentSaleList() {
        const body = document.getElementById('saleListBody');
        if (!body) return;
        body.innerHTML = '';
        let total = 0;
        currentSaleItems.forEach((item, index) => {
            total += item.total;
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
        document.getElementById('currentSaleTotal').innerText = `₦${total.toLocaleString()}`;
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
        const charges = parseFloat(document.getElementById('saleCharges').value) || 0;
        
        let subtotal = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
        let totalUnits = currentSaleItems.reduce((sum, item) => sum + (item.qty || 0), 0);
        const grandTotal = subtotal - discount + charges;

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
                                    <div style="font-weight: 600; color: #000;">${item.name}</div>
                                    <div style="font-size: 10px; color: #777; margin-top: 3px; line-height: 1.4;">${item.description || ''}</div>
                                </td>
                                <td style="padding: 10px; text-align: center; font-size: 12px; vertical-align: top;">${item.qty}.00</td>
                                <td style="padding: 10px; text-align: right; font-size: 12px; vertical-align: top;">${(item.price || 0).toLocaleString()}.00</td>
                                <td style="padding: 10px; text-align: right; font-size: 12px; vertical-align: top; font-weight: 600;">${(item.total || 0).toLocaleString()}.00</td>
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
                            <p style="margin: 0; font-weight: 700; line-height: 1.4;">For hygiene and safety reasons, we cannot accept returns of opened items. If your order arrives damaged, please contact us within 24 hrs of delivery.</p>
                        </div>
                    </div>
                    <div style="width: 40%; background: #fafafa; padding: 15px; border-radius: 4px; height: fit-content; border: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                            <span style="color: #777;">Sub Total</span>
                            <span style="color: #444;">${(sale.total || 0).toLocaleString()}.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #eee; font-weight: bold; font-size: 12px;">
                            <span style="color: #000;">Total</span>
                            <span style="color: #000;">₦${(sale.total || 0).toLocaleString()}.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 0 0; margin-top: 5px;">
                            <span style="font-weight: bold; color: #2e7d32; font-size: 13px;">Balance Due</span>
                            <span style="font-weight: bold; color: #2e7d32; font-size: 16px;">₦${(sale.total || 0).toLocaleString()}.00</span>
                        </div>
                    </div>
                </div>

                <!-- Footer attribution -->
                <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                    <div style="color: #999; font-size: 9px; text-align: left;">
                        <p style="margin: 0;">Thank you for your patronage!</p>
                        <p style="margin: 5px 0 0; color: #555;">Scan to visit our website: <strong>www.shayorscosmestics.com</strong></p>
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

    window.downloadInvoice = function(id) {
        const sale = sales.find(s => s.apiId === id || s.id === id);
        if (!sale) return;
        
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

    async function renderSalesHistory() {
        const body = document.getElementById('salesHistoryBody');
        if (!body) return;
        
        // Use reconciled sales from localStorage
        const localSales = [...sales].reverse();
        
        body.innerHTML = '';
        localSales.forEach(s => {
            const date = new Date(s.date).toLocaleDateString();
            const itemCount = Array.isArray(s.items) ? s.items.length : 1;
            const badgeClass = s.status === 'Paid' ? 'badge-in' : 'badge-out';
            
            body.innerHTML += `
                <tr>
                    <td>${(s.apiId || s.id || '').toString().slice(-6).toUpperCase()}</td>
                    <td>${date}</td>
                    <td>${s.customer || 'Walk-in'}</td>
                    <td>${itemCount} items (${s.type || 'product'})</td>
                    <td>₦${(s.total || 0).toLocaleString()}</td>
                    <td><span class="badge ${badgeClass}">${s.status || 'Paid'}</span></td>
                    <td>
                        <button class="btn secondary" onclick='viewOrder("${s.apiId || s.id}")'>View</button>
                        <button class="btn primary" onclick='downloadInvoice("${s.apiId || s.id}")'>Inv</button>
                        <button class="btn danger" onclick='deleteOrder("${s.apiId || s.id}")'>Del</button>
                    </td>
                </tr>
            `;
        });
        
        if (localSales.length === 0) {
            body.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
        }
    }

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
        if (!confirm("Delete this order?")) return;
        
        // Remove from local first
        sales = sales.filter(s => s.apiId !== id && s.id !== id);
        localStorage.setItem('shayorsSales', JSON.stringify(sales));

        try {
            const response = await fetch(`${API_BASE}/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            
            // Also try deleting from bookings if it was a spa service
            await fetch(`${API_BASE}/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            }).catch(() => {});

            renderSalesHistory();
            if (typeof renderAnalytics === 'function') renderAnalytics();
        } catch (e) { 
            console.error(e); 
            renderSalesHistory();
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
                    <td>${e.date}<br><small>${e.code || ''}</small></td>
                    <td>${e.category}</td>
                    <td>${e.description}<br><small>Vendor: ${e.vendor || 'N/A'}</small></td>
                    <td>${e.paymentMethod || 'N/A'}</td>
                    <td>₦${e.amount.toLocaleString()}</td>
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
            return sum + (s.items || []).reduce((itemSum, item) => itemSum + (item.actualQty || item.qty || 0), 0);
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
        document.getElementById('customerForm').classList.toggle('hidden');
        if (!document.getElementById('customerForm').classList.contains('hidden')) {
            document.getElementById('cDate').value = new Date().toISOString().split('T')[0];
        }
    };

    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('cId').value;
            const custData = {
                id: id ? id : 'C' + Date.now(),
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

            if (id) {
                const idx = customers.findIndex(c => c.id === id);
                if (idx !== -1) customers[idx] = custData;
            } else {
                customers.push(custData);
            }

            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));
            renderCustomers();
            customerForm.reset();
            toggleCustomerForm();
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
                    <button class="btn secondary" onclick="editCustomer('${c.id}')">Edit</button>
                    <button class="btn danger" onclick="deleteCustomer('${c.id}')">Del</button>
                </td>
            `;
            body.appendChild(row);
        });
    }

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
            customers = customers.filter(c => c.id !== id);
            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));
            renderCustomers();
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
    }

    function renderStaff() {
        const list = document.getElementById('staffList');
        if (!list) return;
        list.innerHTML = '';
        staff.forEach((s, idx) => {
            list.innerHTML += `
                <li>
                    <strong>${s.name}</strong> (${s.role})<br>
                    <button class="btn danger btn-xs" onclick="deleteStaff(${idx})">x</button>
                </li>`;
        });
    }

    function renderRoles() {
        const list = document.getElementById('rolesList');
        if (!list) return;
        list.innerHTML = '';
        roles.forEach((r, idx) => {
            list.innerHTML += `
                <li>
                    <strong>${r.name}</strong>
                    <p><small>${r.permissions.join(', ')}</small></p>
                    ${r.name !== 'Admin' ? `<button class="btn danger btn-xs" onclick="deleteRole(${idx})">x</button>` : ''}
                </li>`;
        });
    }

    window.toggleRoleForm = function() {
        document.getElementById('roleForm').classList.toggle('hidden');
    };

    const roleForm = document.getElementById('roleForm');
    if (roleForm) {
        roleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const checked = Array.from(roleForm.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            const r = {
                name: document.getElementById('roleName').value,
                permissions: checked
            };
            roles.push(r);
            localStorage.setItem('shayorsRoles', JSON.stringify(roles));
            renderRoles();
            updateStaffRoleDropdown();
            roleForm.reset();
            toggleRoleForm();
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
        document.getElementById('staffForm').classList.toggle('hidden');
    };

    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const s = {
                id: Date.now(),
                name: document.getElementById('staffName').value,
                role: document.getElementById('staffRole').value
            };
            staff.push(s);
            localStorage.setItem('shayorsStaff', JSON.stringify(staff));
            renderStaff();
            staffForm.reset();
            toggleStaffForm();
        });
    }

    window.deleteStaff = function(idx) {
        if (confirm('Delete this staff member?')) {
            staff.splice(idx, 1);
            localStorage.setItem('shayorsStaff', JSON.stringify(staff));
            renderStaff();
        }
    };

    window.deleteRole = function(idx) {
        if (confirm('Delete this role?')) {
            roles.splice(idx, 1);
            localStorage.setItem('shayorsRoles', JSON.stringify(roles));
            renderRoles();
            updateStaffRoleDropdown();
        }
    };

    window.printTest = function() {
        alert('Printer test command sent to connected device.');
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
                    const response = await fetch(`${API_BASE}/products/${productId}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({ stock: newStock })
                    });

                    if (response.ok) {
                        product.stock = newStock;
                        const adj = {
                            date: new Date().toISOString(),
                            productName: product.name,
                            type,
                            qty,
                            reason
                        };
                        adjustments.push(adj);
                        localStorage.setItem('shayorsAdjustments', JSON.stringify(adjustments));
                        renderAdjustments();
                        renderInventory();
                        adjustmentForm.reset();
                        toggleAdjustmentForm();
                        alert('Stock adjusted and synced to backend.');
                    } else {
                        const err = await response.json();
                        alert(`Adjustment failed: ${err.message}`);
                    }
                } catch (error) {
                    console.error("Adjustment sync failed:", error);
                    alert("Could not connect to server to update stock.");
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
            const sRes = await fetch(`${API_BASE}/services`);
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
            const bRes = await fetch(`${API_BASE}/bookings`, {
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            if (bRes.ok) {
                const bookings = await bRes.json();
                bookingsBody.innerHTML = '';
                bookings.forEach(b => {
                    bookingsBody.innerHTML += `
                        <tr>
                            <td>${new Date(b.createdAt).toLocaleDateString()}</td>
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
            const response = await fetch(`${API_BASE}/orders`, {
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
            const response = await fetch(`${API_BASE}/categories`);
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
            spaCategory.innerHTML = '<option value="">Select Category...</option>' + 
                spaCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
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

    // Initialize
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam) {
        showModule(moduleParam);
    } else {
        renderInventory();
    }
});
