document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://shayors-cosmetics.onrender.com/api";

    // 0. Admin Authentication
    async function init() {
        const token = sessionStorage.getItem('shayorsAdminToken');
        if (!token) {
            const password = prompt("Enter Admin Password:");

            if (!password) {
                window.location.href = "../index.html";
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('shayorsAdminToken', data.token);
                    sessionStorage.setItem('shayorsAdminAuthenticated', 'true');
                    fetchInventory();
                } else {
                    alert("Access Denied! Invalid Credentials.");
                    window.location.href = "../index.html";
                }
            } catch (error) {
                console.error("Login failed:", error);
                alert("Server error. Redirecting...");
                window.location.href = "../index.html";
            }
        } else {
            fetchInventory();
        }
    }

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

    let currentSaleItems = [];

    // Fetch Inventory from Backend
    async function fetchInventory() {
        try {
            const response = await fetch(`${API_BASE}/products`);
            if (response.ok) {
                inventory = await response.json();
                renderInventory();
            } else {
                console.error("Failed to fetch inventory from server.");
                inventory = JSON.parse(localStorage.getItem('shayorsInventory')) || [];
                renderInventory();
            }
        } catch (error) {
            console.error("Error connecting to backend:", error);
            inventory = JSON.parse(localStorage.getItem('shayorsInventory')) || [];
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
        if (moduleId === 'sales') { renderSalesHistory(); updateSaleProductDropdown(); }
        if (moduleId === 'expenses') renderExpenses();
        if (moduleId === 'analytics') renderAnalytics();
        if (moduleId === 'spa') renderSpaServices();
        if (moduleId === 'adjustments') { renderAdjustments(); updateAdjustmentProductDropdown(); }
        if (moduleId === 'customers') renderCustomers();
        if (moduleId === 'suppliers') renderSuppliers();
        if (moduleId === 'store') { renderStore(); updateStaffRoleDropdown(); }
    };

    // 4. Image Handling
    window.previewImage = function(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const preview = document.getElementById('imagePreview');
            preview.src = reader.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(event.target.files[0]);
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
            ingredients: document.getElementById('pIngredients') ? document.getElementById('pIngredients').value : '',
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
                        'Authorization': `Bearer ${sessionStorage.getItem('shayorsAdminToken')}`
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                // CREATE new product
                response = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('shayorsAdminToken')}`
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
                        'Authorization': `Bearer ${sessionStorage.getItem('shayorsAdminToken')}`
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
                        'Authorization': `Bearer ${sessionStorage.getItem('shayorsAdminToken')}`
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
                        'Authorization': `Bearer ${sessionStorage.getItem('shayorsAdminToken')}`
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
        const term = document.getElementById('inventorySearch').value.toLowerCase();
        const filtered = inventory.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.brand.toLowerCase().includes(term)
        );
        renderInventory(filtered);
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

    window.finalizeSale = function(type) {
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
        const grandTotal = subtotal - discount + charges;

        const sale = {
            id: 'S' + Date.now(),
            date: new Date().toISOString(),
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

        const adminToken = sessionStorage.getItem('shayorsAdminToken');

        currentSaleItems.forEach(async (item) => {
            const p = inventory.find(p => p._id == item.productId);
            if (p) {
                const newStock = p.stock - item.actualQty;
                p.stock = newStock;
                
                // Sync stock update to backend
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
                    console.error(`Stock sync failed for ${p.name}:`, error);
                }
            }
        });

        sales.push(sale);
        localStorage.setItem('shayorsSales', JSON.stringify(sales));
        // Removed localStorage inventory sync as we use backend now

        if (contact || customerName !== 'Walk-in Customer') {
            const debtorRecord = {
                id: 'C' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                invoiceNo: sale.id,
                name: customerName,
                contact: contact,
                product: currentSaleItems.map(i => i.name).join(', '),
                totalAmount: grandTotal,
                partlyPaid: sale.amountPaid,
                dueDate: '', // To be filled later if needed
                status: paymentStatus
            };
            customers.push(debtorRecord);
            localStorage.setItem('shayorsCustomers', JSON.stringify(customers));
        }

        if (platform === 'WhatsApp' || type === 'whatsapp') {
            sendWhatsAppOrder(sale);
        }

        generateInvoice(sale);
        
        currentSaleItems = [];
        renderCurrentSaleList();
        renderSalesHistory();
        document.getElementById('newSaleSection').classList.add('hidden');
        alert('Sale Recorded Successfully!');
    };

    window.returnSale = function(id) {
        if (confirm('Return this sale? Stock will be restored and sale will be removed.')) {
            const saleIdx = sales.findIndex(s => s.id === id);
            const sale = sales[saleIdx];
            
            const adminToken = sessionStorage.getItem('shayorsAdminToken');
            
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
        window.open(`https://wa.me/2348123456789?text=${msg}`); 
    }

    function generateInvoice(sale) {
        const inv = document.getElementById('invoicePreview');
        if (!inv) return;
        inv.classList.remove('hidden');
        inv.innerHTML = `
            <div class="invoice-header">
                <h3>SHAYORS COSMETICS</h3>
                <p>Invoice #${sale.id}</p>
                <small>${new Date(sale.date).toLocaleString()}</small>
                <p><strong>Status: ${sale.status}</strong></p>
            </div>
            <div class="invoice-body">
                <p>Customer: ${sale.customer}</p>
                <hr>
                ${sale.items.map(item => `
                    <div class="invoice-item">
                        <span>${item.name} x${item.qty}</span>
                        <span>₦${item.total.toLocaleString()}</span>
                    </div>
                `).join('')}
                <hr>
                <div class="invoice-total">
                    <p>Total: ₦${sale.total.toLocaleString()}</p>
                </div>
            </div>
            <button class="btn secondary" onclick="window.print()">Print Receipt</button>
        `;
    }

    function renderSalesHistory() {
        const body = document.getElementById('salesHistoryBody');
        if (!body) return;
        body.innerHTML = '';
        sales.slice().reverse().forEach(s => {
            body.innerHTML += `
                <tr>
                    <td>${s.id}</td>
                    <td>${new Date(s.date).toLocaleDateString()}</td>
                    <td>${s.customer}</td>
                    <td>${s.items.length} items</td>
                    <td>₦${s.total.toLocaleString()}</td>
                    <td>${s.status} (${s.type})</td>
                    <td>
                        <button class="btn secondary" onclick='viewInvoice("${s.id}")'>View</button>
                        <button class="btn danger" onclick='returnSale("${s.id}")'>Return</button>
                    </td>
                </tr>
            `;
        });
    }

    window.viewInvoice = function(id) {
        const sale = sales.find(s => s.id === id);
        if (sale) generateInvoice(sale);
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
    function renderAnalytics() {
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

        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
        const creditSales = sales.filter(s => s.status !== 'Paid').reduce((sum, s) => sum + (s.total - (s.amountPaid || 0)), 0);
        const debtorsTotal = customers.reduce((sum, c) => sum + ((c.totalAmount || 0) - (c.partlyPaid || 0)), 0);
        const expectedProfit = totalRetailVal - totalCostVal;

        document.getElementById('anaTotalItems').innerText = inventory.length;
        document.getElementById('anaTotalStock').innerText = totalStock;
        document.getElementById('anaRetailValue').innerText = `₦${totalRetailVal.toLocaleString()}`;
        document.getElementById('anaInvCost').innerText = `₦${totalCostVal.toLocaleString()}`;
        document.getElementById('anaTotalSales').innerText = `₦${totalSales.toLocaleString()}`;
        document.getElementById('anaExpProfit').innerText = `₦${expectedProfit.toLocaleString()}`;
        document.getElementById('anaLowStock').innerText = lowStockCount;
        document.getElementById('anaCreditSales').innerText = `₦${creditSales.toLocaleString()}`;
        document.getElementById('anaDebtors').innerText = `₦${debtorsTotal.toLocaleString()}`;

        // Top Channel Logic
        const channelCounts = {};
        sales.forEach(s => {
            channelCounts[s.platform] = (channelCounts[s.platform] || 0) + 1;
        });
        const topChannel = Object.keys(channelCounts).reduce((a, b) => channelCounts[a] > channelCounts[b] ? a : b, 'N/A');
        document.getElementById('anaTopChannel').innerText = topChannel;
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
                <td>₦${(c.totalAmount || 0).toLocaleString()}</td>
                <td>₦${(c.partlyPaid || 0).toLocaleString()}</td>
                <td style="color: ${balance > 0 ? 'red' : 'green'}">₦${balance.toLocaleString()}</td>
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
                const adminToken = sessionStorage.getItem('shayorsAdminToken');

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

    // Initialize
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam) {
        showModule(moduleParam);
    } else {
        renderInventory();
    }
});
