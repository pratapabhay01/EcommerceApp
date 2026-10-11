const API_URL = "/api";

let allProducts = [];

function getCart() {
    try {
        return JSON.parse(localStorage.getItem("shopEaseCart")) || [];
    } catch {
        return [];
    }
}

function updateCartCount() {
    const count = getCart().reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = count;
    }
}

function updateNavigation() {
    const token = localStorage.getItem("token");
    const loginLink = document.getElementById("loginLink");
    const logoutButton = document.getElementById("logoutButton");

    if (token) {
        loginLink?.classList.add("hidden");
        logoutButton?.classList.remove("hidden");
    } else {
        loginLink?.classList.remove("hidden");
        logoutButton?.classList.add("hidden");
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(price);
}

async function loadProducts() {
    const productList = document.getElementById("productList");

    try {
        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
            throw new Error("Unable to fetch products");
        }

        allProducts = await response.json();

        populateCategories();
        renderProducts();
    } catch (error) {
        productList.innerHTML =
            "<p>Products load nahi ho paaye. Please refresh the page.</p>";
    }
}

function populateCategories() {
    const categoryFilter = document.getElementById("categoryFilter");

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(Boolean)
        )
    ];

    categoryFilter.innerHTML =
        '<option value="all">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}

function renderProducts() {
    const productList = document.getElementById("productList");
    const message = document.getElementById("productMessage");

    const searchTerm = document
        .getElementById("searchInput")
        .value.trim()
        .toLowerCase();

    const category = document.getElementById("categoryFilter").value;
    const sort = document.getElementById("sortFilter").value;

    let products = allProducts.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm);

        const matchesCategory =
            category === "all" || product.category === category;

        return matchesSearch && matchesCategory;
    });

    if (sort === "low") {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
        products.sort((a, b) => b.price - a.price);
    }

    productList.replaceChildren();

    if (products.length === 0) {
        productList.innerHTML =
            "<p>No products found. Try a different search.</p>";

        message.textContent = "";
        return;
    }

    message.textContent = `${products.length} product(s) available`;

    products.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageContainer = document.createElement("div");
        imageContainer.className = "product-image";

        if (product.image) {
            const img = document.createElement("img");

            img.src = product.image;
            img.alt = product.name;
            img.loading = "lazy";

            img.onerror = () => {
                img.remove();

                const placeholder = document.createElement("span");
                placeholder.className = "placeholder";
                placeholder.textContent = "🛍️";

                imageContainer.appendChild(placeholder);
            };

            imageContainer.appendChild(img);
        } else {
            const placeholder = document.createElement("span");
            placeholder.className = "placeholder";
            placeholder.textContent = "🛍️";

            imageContainer.appendChild(placeholder);
        }

        const info = document.createElement("div");
        info.className = "product-info";

        const categoryLabel = document.createElement("span");
        categoryLabel.className = "product-category";
        categoryLabel.textContent = product.category;

        const title = document.createElement("h3");
        title.textContent = product.name;

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description;

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const stock = document.createElement("p");
        stock.className = "stock-info";
        stock.textContent = product.stock > 0
            ? `${product.stock} available`
            : "Out of stock";

        const button = document.createElement("button");
        button.className = "add-cart-button";
        button.textContent = product.stock > 0
            ? "Add to Cart +"
            : "Out of Stock";

        button.disabled = product.stock <= 0;

        button.addEventListener("click", () => addToCart(product._id));

        info.append(
            categoryLabel,
            title,
            description,
            price,
            stock,
            button
        );

        card.append(imageContainer, info);
        productList.appendChild(card);
    });
}

function addToCart(productId) {
    const product = allProducts.find(item => item._id === productId);

    if (!product || product.stock < 1) {
        alert("This product is currently unavailable.");
        return;
    }

    const cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert("You have reached the available stock limit.");
            return;
        }

        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image || "",
            quantity: 1
        });
    }

    localStorage.setItem("shopEaseCart", JSON.stringify(cart));

    updateCartCount();

    alert(`${product.name} added to cart!`);
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavigation();
    updateCartCount();

    document
        .getElementById("searchInput")
        .addEventListener("input", renderProducts);

    document
        .getElementById("categoryFilter")
        .addEventListener("change", renderProducts);

    document
        .getElementById("sortFilter")
        .addEventListener("change", renderProducts);

    loadProducts();
});