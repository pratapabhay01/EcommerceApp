const API_BASE = "/api";

const adminMessage = document.getElementById("adminMessage");
const productsMessage = document.getElementById("productsMessage");
const ordersMessage = document.getElementById("ordersMessage");

const productForm = document.getElementById("productForm");
const productFormTitle = document.getElementById("productFormTitle");
const saveProductButton = document.getElementById("saveProductButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const adminProducts = document.getElementById("adminProducts");
const adminOrders = document.getElementById("adminOrders");

let editingProductId = null;
let productsCache = [];

// ---------------- AUTHENTICATION ----------------

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
}

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "green" : "crimson";
}

async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Please login first.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

// ---------------- HELPERS ----------------

function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

function addText(parent, tag, text, className = "") {
    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);

    return element;
}

function createButton(text, className, onClick) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = `admin-button ${className || ""}`;

    button.addEventListener("click", onClick);

    return button;
}

// ---------------- PRODUCTS ----------------

async function loadAdminProducts() {
    adminProducts.textContent = "Loading products...";

    try {
        const products = await apiRequest(`${API_BASE}/products`);

        productsCache = products;
        adminProducts.replaceChildren();

        if (products.length === 0) {
            addText(adminProducts, "p", "No products available.", "admin-empty");
            return;
        }

        products.forEach(product => {
            const card = document.createElement("article");
            card.className = "admin-item";

            addText(card, "h3", product.name);
            addText(card, "p", `Price: ${formatPrice(product.price)}`);
            addText(card, "p", `Category: ${product.category}`);
            addText(card, "p", `Stock: ${product.stock}`);
            addText(card, "p", product.description);

            const actions = document.createElement("div");
            actions.className = "admin-actions";

            actions.appendChild(
                createButton("Edit", "", () => {
                    startEditingProduct(product);
                })
            );

            actions.appendChild(
                createButton("Delete", "delete-button", async () => {
                    await deleteProduct(product._id, product.name);
                })
            );

            card.appendChild(actions);
            adminProducts.appendChild(card);
        });

        showMessage(productsMessage, "Products loaded successfully.", true);

    } catch (error) {
        adminProducts.textContent = "Unable to load products.";
        showMessage(productsMessage, error.message);
    }
}

function startEditingProduct(product) {
    editingProductId = product._id;

    document.getElementById("productName").value = product.name;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productImage").value = product.image || "";

    productFormTitle.textContent = "Edit Product";
    saveProductButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function resetProductForm() {
    editingProductId = null;
    productForm.reset();

    productFormTitle.textContent = "Add New Product";
    saveProductButton.textContent = "Add Product";
    cancelEditButton.hidden = true;
}

cancelEditButton.addEventListener("click", resetProductForm);

productForm.addEventListener("submit", async event => {
    event.preventDefault();

    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);

    if (!Number.isFinite(price) || price < 0) {
        showMessage(productsMessage, "Enter a valid product price.");
        return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
        showMessage(productsMessage, "Stock must be a non-negative whole number.");
        return;
    }

    const productData = {
        name: document.getElementById("productName").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
        price,
        category: document.getElementById("productCategory").value.trim(),
        stock,
        image: document.getElementById("productImage").value.trim()
    };

    saveProductButton.disabled = true;

    try {
        if (editingProductId) {
            await apiRequest(`${API_BASE}/products/${editingProductId}`, {
                method: "PUT",
                body: JSON.stringify(productData)
            });

            showMessage(productsMessage, "Product updated successfully!", true);
        } else {
            await apiRequest(`${API_BASE}/products`, {
                method: "POST",
                body: JSON.stringify(productData)
            });

            showMessage(productsMessage, "Product added successfully!", true);
        }

        resetProductForm();
        await loadAdminProducts();

    } catch (error) {
        showMessage(productsMessage, error.message);
    } finally {
        saveProductButton.disabled = false;
    }
});

async function deleteProduct(productId, productName) {
    const confirmed = confirm(
        `Are you sure you want to delete "${productName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`${API_BASE}/products/${productId}`, {
            method: "DELETE"
        });

        showMessage(productsMessage, "Product deleted successfully!", true);
        await loadAdminProducts();

    } catch (error) {
        showMessage(productsMessage, error.message);
    }
}

// ---------------- CUSTOMER ORDERS ----------------

async function loadAdminOrders() {
    adminOrders.textContent = "Loading orders...";

    try {
        const orders = await apiRequest(`${API_BASE}/orders`);

        adminOrders.replaceChildren();

        if (!Array.isArray(orders) || orders.length === 0) {
            addText(adminOrders, "p", "No customer orders yet.", "admin-empty");
            return;
        }

        orders.forEach(order => {
            const card = document.createElement("article");
            card.className = "admin-item";

            addText(
                card,
                "h3",
                `Order #${order._id.slice(-8).toUpperCase()}`
            );

            addText(
                card,
                "p",
                `Customer: ${order.user?.name || "Unknown"} (${order.user?.email || "No email"})`
            );

            addText(card, "p", `Total: ${formatPrice(order.totalAmount)}`);
            addText(card, "p", `Placed: ${new Date(order.createdAt).toLocaleString("en-IN")}`);

            addText(
                card,
                "p",
                "Items: " + (order.items || [])
                    .map(item => `${item.name} × ${item.quantity}`)
                    .join(", ")
            );

            addText(
                card,
                "p",
                `Delivery: ${order.shippingAddress?.fullName || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`
            );

            const actions = document.createElement("div");
            actions.className = "admin-actions";

            const statusSelect = document.createElement("select");

            const statuses = [
                "Pending",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ];

            statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                option.selected = status === order.status;
                statusSelect.appendChild(option);
            });

            const updateButton = createButton(
                "Update Status",
                "",
                async () => {
                    updateButton.disabled = true;

                    try {
                        await apiRequest(
                            `${API_BASE}/orders/${order._id}/status`,
                            {
                                method: "PATCH",
                                body: JSON.stringify({
                                    status: statusSelect.value
                                })
                            }
                        );

                        showMessage(
                            ordersMessage,
                            "Order status updated successfully!",
                            true
                        );

                        await loadAdminOrders();

                    } catch (error) {
                        showMessage(ordersMessage, error.message);
                    } finally {
                        updateButton.disabled = false;
                    }
                }
            );

            actions.append(statusSelect, updateButton);
            card.appendChild(actions);
            adminOrders.appendChild(card);
        });

        showMessage(ordersMessage, "Orders loaded successfully.", true);

    } catch (error) {
        adminOrders.textContent = "Unable to load customer orders.";
        showMessage(ordersMessage, error.message);
    }
}

// ---------------- START DASHBOARD ----------------

async function initAdminDashboard() {
    const user = getUser();

    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }

    if (!user || user.role !== "admin") {
        showMessage(
            adminMessage,
            "Admin access required. Please login with your admin account."
        );

        return;
    }

    showMessage(
        adminMessage,
        `Welcome, ${user.name}! Admin access verified.`,
        true
    );

    await Promise.all([
        loadAdminProducts(),
        loadAdminOrders()
    ]);
}

initAdminDashboard();