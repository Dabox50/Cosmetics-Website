document.addEventListener('DOMContentLoaded', () => {
    // 0. Simple Admin Access Check
    const adminAuth = sessionStorage.getItem('shayorsAdminAuthenticated');
    if (!adminAuth) {
        const password = prompt("Enter Admin Password to access Inventory:");
        if (password === "Dabox123") { // You can change this password
            sessionStorage.setItem('shayorsAdminAuthenticated', 'true');
        } else {
            alert("Access Denied!");
            window.location.href = "index.html";
            return;
        }
    }

    // Clear old cached data to load new images
    localStorage.removeItem('shayorsInventory');

    // 1. Initial Inventory Data (Ensuring all requested brands/categories are present)
    const initialProducts = [
        { id: 1, category: "Skincare", name: "Cerave Hydrating Cleanser", brand: "Cerave", shade: "N/A", size: "236ml", ingredients: "Ceramides, Hyaluronic Acid", price: 18.00, stock: 24, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.34 AM.jpeg" },
        { id: 2, category: "Bath & Body", name: "Halfacast Skin Glow Oil", brand: "Halfacast", shade: "N/A", size: "200ml", ingredients: "Natural Oils, Vitamin E", price: 35.00, stock: 12, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.33 AM.jpeg" },
        { id: 3, category: "Skincare", name: "Cosrx Snail Mucin Essence", brand: "Cosrx", shade: "N/A", size: "100ml", ingredients: "96% Snail Mucin", price: 22.00, stock: 3, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.33 AM (1).jpeg" },
        { id: 4, category: "Facecream", name: "Olay Regenerist Cream", brand: "Olay", shade: "N/A", size: "50g", ingredients: "Niacinamide, Peptides", price: 45.00, stock: 0, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.32 AM.jpeg" },
        { id: 5, category: "Bath & Body", name: "Halfacast Black Soap", brand: "Halfacast", shade: "N/A", size: "500g", ingredients: "African Black Soap, Honey", price: 15.00, stock: 50, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.32 AM (1).jpeg" },
        { id: 6, category: "Spa", name: "Luxury Spa Mist", brand: "Spa", shade: "N/A", size: "150ml", ingredients: "Essential Oils, Eucalyptus", price: 28.00, stock: 10, threshold: 5, image:"../Image/WhatsApp Image 2026-02-20 at 9.52.31 AM.jpeg" },
        { id: 7, category: "Perfume", name: "Midnight Bloom", brand: "Fragrance", shade: "N/A", size: "100ml", ingredients: "Floral notes, Musk", price: 60.00, stock: 15, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.30 AM.jpeg" },
        { id: 8, category: "Supplements", name: "Glow Vitamins", brand: "Supplements", shade: "N/A", size: "60 caps", ingredients: "Biotin, Vitamin C", price: 30.00, stock: 30, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.29 AM.jpeg" },
        { id: 9, category: "Sunscreen", name: "Ultra UV Shield", brand: "Sunscreen", shade: "N/A", size: "50ml", ingredients: "Zinc Oxide, SPF 50", price: 25.00, stock: 20, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.39 AM.jpeg" },
        { id: 10, category: "Humidifiers", name: "Zen Mist Humidifier", brand: "Humidifiers", shade: "N/A", size: "Large", ingredients: "N/A", price: 40.00, stock: 8, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.39 AM (1).jpeg" },
        { id: 11, category: "Diffusers", name: "Aroma Diffuser", brand: "Diffusers", shade: "N/A", size: "Compact", ingredients: "N/A", price: 35.00, stock: 5, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.38 AM.jpeg" },
        { id: 12, category: "Skincare", name: "Cerave Moisturizing Lotion", brand: "Cerave", shade: "N/A", size: "473ml", ingredients: "Ceramides, MVE Technology", price: 20.00, stock: 15, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.38 AM (1).jpeg" },
        { id: 13, category: "Fragrance", name: "Velvet Oud", brand: "Fragrance", shade: "N/A", size: "50ml", ingredients: "Agarwood, Rose", price: 85.00, stock: 4, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.37 AM.jpeg" },
        { id: 14, category: "Bath & Body", name: "Halfacast Brightening Soap", brand: "Halfacast", shade: "N/A", size: "250g", ingredients: "Kojic Acid, Turmeric", price: 12.00, stock: 25, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.37 AM (1).jpeg" },
        { id: 15, category: "Spa", name: "Himalayan Salt Scrub", brand: "Spa", shade: "N/A", size: "300g", ingredients: "Pink Salt, Coconut Oil", price: 24.00, stock: 18, threshold: 5, image:"../Image/WhatsApp Image 2026-02-20 at 9.52.41 AM (2).jpeg" },
        { id: 16, category: "Skincare", name: "Cosrx BHA Blackhead Power Liquid", brand: "Cosrx", shade: "N/A", size: "100ml", ingredients: "BHA, Niacinamide", price: 26.00, stock: 10, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.41 AM (1).jpeg" },
        { id: 17, category: "Facecream", name: "Olay Luminous Brightening Cream", brand: "Olay", shade: "N/A", size: "50g", ingredients: "Vitamin B3, Pearl Extract", price: 38.00, stock: 14, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.40 AM.jpeg" },
        { id: 18, category: "Bath & Body", name: "Halfacast Vitamin C Body Wash", brand: "Halfacast", shade: "N/A", size: "500ml", ingredients: "Vitamin C, Aloe Vera", price: 22.00, stock: 20, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.41 AM.jpeg" },
        { id: 19, category: "Supplements", name: "Collagen Boost Powder", brand: "Supplements", shade: "N/A", size: "300g", ingredients: "Bovine Collagen, Vitamin C", price: 45.00, stock: 12, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.42 AM (1).jpeg" },
        { id: 20, category: "Sunscreen", name: "Cerave Sunscreen Stick SPF 50", brand: "Cerave", shade: "N/A", size: "42g", ingredients: "Zinc Oxide, Ceramides", price: 16.00, stock: 40, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.46 AM.jpeg" },
        { id: 21, category: "Skincare", name: "Face Serum", brand: "Cosrx", shade: "N/A", size: "30ml", ingredients: "Vitamin C, Niacinamide", price: 28.00, stock: 15, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.43 AM.jpeg" },
        { id: 22, category: "Perfume", name: "Golden Aura", brand: "Fragrance", shade: "N/A", size: "100ml", ingredients: "Amber, Jasmine", price: 75.00, stock: 8, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.44 AM.jpeg" },
        { id: 23, category: "Spa", name: "Detox Body Wrap", brand: "Spa", shade: "N/A", size: "1 kit", ingredients: "Seaweed, Clay", price: 55.00, stock: 5, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.45 AM.jpeg" },
        { id: 24, category: "Bath & Body", name: "Creamy Shea Butter", brand: "Shayors", shade: "N/A", size: "250ml", ingredients: "Raw Shea Butter", price: 12.00, stock: 22, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.46 AM (1).jpeg" },
        { id: 25, category: "Facecream", name: "Night Repair Cream", brand: "Olay", shade: "N/A", size: "50g", ingredients: "Retinol, Peptides", price: 42.00, stock: 10, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.47 AM.jpeg" },
        { id: 26, category: "Humidifiers", name: "Cool Mist Pro", brand: "Humidifiers", shade: "N/A", size: "Extra Large", ingredients: "N/A", price: 65.00, stock: 3, threshold: 2, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.48 AM.jpeg" },
        { id: 27, category: "Diffusers", name: "Essential Oil Set", brand: "Diffusers", shade: "N/A", size: "Set of 6", ingredients: "Pure Essential Oils", price: 30.00, stock: 18, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.49 AM.jpeg" },
        { id: 28, category: "Supplements", name: "Beauty Sleep Melatonin", brand: "Supplements", shade: "N/A", size: "60 gummies", ingredients: "Melatonin, L-Theanine", price: 25.00, stock: 25, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.50 AM.jpeg" },
        { id: 29, category: "Sunscreen", name: "Sport Shield SPF 70", brand: "Sunscreen", shade: "N/A", size: "100ml", ingredients: "Avobenzone, SPF 70", price: 20.00, stock: 14, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.51 AM.jpeg" },
        { id: 30, category: "Skincare", name: "Hydrating Toner", brand: "Cerave", shade: "N/A", size: "200ml", ingredients: "Ceramides, Witch Hazel", price: 15.00, stock: 30, threshold: 5, image: "../Image/WhatsApp Image 2026-02-20 at 9.52.52 AM.jpeg" }
    ];

    let inventory = JSON.parse(localStorage.getItem('shayorsInventory')) || initialProducts;

    // 1.5 Auto-Restore/Sync Missing Initial Products (User Request)
    let addedCount = 0;
    initialProducts.forEach(p => {
        const exists = inventory.some(item => item.id === p.id);
        if (!exists) {
            inventory.push(p);
            addedCount++;
        }
    });

    // 2. Elements
    const inventoryBody = document.getElementById('inventoryBody');
    const productForm = document.getElementById('productForm');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalValueEl = document.getElementById('totalStockValue');
    const lowStockCountEl = document.getElementById('lowStockCount');
    const alertsList = document.getElementById('alertsList');
    const alertsSection = document.getElementById('alertsContainer');
    const activityLog = document.getElementById('activityLog');

    // 3. Helper for Notifications
    function logActivity(message) {
        const li = document.createElement('li');
        const time = new Date().toLocaleTimeString();
        li.innerHTML = `<strong>[${time}]</strong> ${message}`;
        activityLog.prepend(li);
    }

    if (addedCount > 0) {
        logActivity(`RESTORED: ${addedCount} core products were added back to inventory.`);
    }

    // 4. Render Functions
    function renderInventory(filterData = inventory) {
        inventoryBody.innerHTML = '';
        let totalValue = 0;
        let lowStockCount = 0;
        let alertsHTML = '';

        filterData.forEach(p => {
            const status = p.stock === 0 ? 'Out of Stock' : (p.stock <= p.threshold ? 'Low Stock' : 'In Stock');
            const badgeClass = p.stock === 0 ? 'badge-out' : (p.stock <= p.threshold ? 'badge-low' : 'badge-in');
            
            totalValue += p.price * p.stock;
            if (p.stock <= p.threshold) {
                lowStockCount++;
                alertsHTML += `<li><strong>${p.name}</strong> - Currently ${p.stock} remaining (Restock requested)</li>`;
            }

            inventoryBody.innerHTML += `
                <tr>
                    <td class="prod-info-cell">
                        <h4>${p.name}</h4>
                        <p>${p.brand} | ${p.category}</p>
                    </td>
                    <td>
                        <p><strong>Size:</strong> ${p.size}</p>
                        <p><strong>Shade:</strong> ${p.shade}</p>
                    </td>
                    <td>₦${parseFloat(p.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td>
                        <div class="stock-control">
                            <input type="number" value="${p.stock}" onchange="updateStock(${p.id}, this.value)">
                            <button class="btn primary" onclick="simulateSale(${p.id})">Sell</button>
                        </div>
                    </td>
                    <td><span class="badge ${badgeClass}">${status}</span></td>
                    <td>
                        <button class="btn danger" onclick="deleteProduct(${p.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        totalProductsEl.innerText = inventory.length;
        totalValueEl.innerText = `₦${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        lowStockCountEl.innerText = lowStockCount;

        if (lowStockCount > 0) {
            alertsList.innerHTML = alertsHTML;
            alertsSection.classList.remove('hidden');
        } else {
            alertsSection.classList.add('hidden');
        }

        localStorage.setItem('shayorsInventory', JSON.stringify(inventory));
    }

    // 5. Global Actions
    window.toggleForm = () => productForm.classList.toggle('hidden');

    window.updateStock = (id, newVal) => {
        const index = inventory.findIndex(p => p.id === id);
        if (index !== -1) {
            const oldStock = inventory[index].stock;
            const newStock = parseInt(newVal) || 0;
            inventory[index].stock = newStock;
            
            if (newStock > oldStock) {
                logActivity(`RESTOCKED: ${inventory[index].name} increased from ${oldStock} to ${newStock}.`);
            }
            renderInventory();
        }
    };

    window.simulateSale = (id) => {
        const index = inventory.findIndex(p => p.id === id);
        if (index !== -1 && inventory[index].stock > 0) {
            inventory[index].stock--;
            logActivity(`SOLD: 1 unit of ${inventory[index].name}. Remaining: ${inventory[index].stock}.`);
            renderInventory();
        } else {
            alert('Cannot sell item: Out of Stock!');
        }
    };

    window.deleteProduct = (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const p = inventory.find(prod => prod.id === id);
            inventory = inventory.filter(prod => prod.id !== id);
            logActivity(`DELETED: ${p.name} was removed from inventory.`);
            renderInventory();
        }
    };

    window.searchInventory = () => {
        const query = document.getElementById('inventorySearch').value.toLowerCase();
        const filtered = inventory.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query)
        );
        renderInventory(filtered);
    };

    // 6. Form Submission
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            id: Date.now(),
            name: document.getElementById('pName').value,
            brand: document.getElementById('pBrand').value,
            category: "General", // Default for now
            shade: document.getElementById('pShade').value || 'N/A',
            size: document.getElementById('pSize').value,
            price: parseFloat(document.getElementById('pPrice').value),
            stock: parseInt(document.getElementById('pStock').value),
            ingredients: document.getElementById('pIngredients').value,
            threshold: 5,
            image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400"
        };

        inventory.push(newProduct);
        logActivity(`ADDED: New product "${newProduct.name}" added to inventory.`);
        renderInventory();
        productForm.reset();
        productForm.classList.add('hidden');
    });

    renderInventory();
});
