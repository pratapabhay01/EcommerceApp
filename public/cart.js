const CART_API = "/api";

function readCart() {
    try {
        return JSON.parse(localStorage.getItem("shopEaseCart")) || [];
    } catch {
        return [];
    }
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function updateCartCount() {
    const count = readCart().reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    document.getElementById("cartCount").textContent = count;
}

async function refreshCart() {
    const container = document.getElementById("cartItems");

    try {
        const response = await fetch(`${CART_API}/products`);

        if (!response.ok) {
            throw new Error("Unable to fetch products");
        }

        const products = await response.json();
        const productMap = new Map(
            products.map(product => [product._id, product])
        );

        const cart = readCart();

        // Remove products that no longer exist.
        const validCart = cart.filter(
            item => productMap.has(item.productId)
        );

        if (validCart.length !== cart.length) {
            localStorage.setItem(
                "shopEaseCart",
                JSON.stringify(validCart)
            );
        }

        container.replaceChildren();

        if (validCart.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-cart";
            empty.innerHTML = `
                <h2>Your cart is empty 🛒</h2>
                <p>Discover something you'll love.</p>
                <a href="index.html#products">Explore Products</a>
            `;

            container.appendChild(empty);
            updateSummary(0);
            updateCartCount();
            return;
        }

        let subtotal = 0;

        validCart.forEach(item => {
            const product = productMap.get(item.productId);
            const availableStock = product.stock;
            const quantity = Math.min(item.quantity, availableStock);

            if (quantity <= 0) {
                return;
            }

            subtotal += product.price * quantity;

            const card = document.createElement("article");
            card.className = "cart-item";

            const image = document.createElement("img");
            image.src = product.image || "https://placehold.co/100x100?text=Product";
            image.alt = product.name;
            image.onerror = () => {
                image.src = "https://placehold.co/100x100?text=Product";
            };

            const content = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = product.name;

            const category = document.createElement("p");
            category.textContent = product.category;

            const price = document.createElement("p");
            price.className = "cart-item-price";
            price.textContent = money(product.price);

            const actions = document.createElement("div");
            actions.className = "cart-item-actions";

            const quantityControl = document.createElement("div");
            quantityControl.className = "quantity-control";

            const decrease = document.createElement("button");
            decrease.textContent = "−";
            decrease.setAttribute("aria-label", "Decrease quantity");
            decrease.disabled = quantity <= 1;

            decrease.addEventListener("click", () => {
                changeQuantity(item.productId, -1);
            });

            const quantityLabel = document.createElement("span");
            quantityLabel.textContent = quantity;

            const increase = document.createElement("button");
            increase.textContent = "+";
            increase.setAttribute("aria-label", "Increase quantity");
            increase.disabled = quantity >= availableStock;

            increase.addEventListener("click", () => {
                changeQuantity(item.productId, 1, availableStock);
            });

            quantityControl.append(decrease, quantityLabel, increase);

            const remove = document.createElement("button");
            remove.className = "remove-button";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                removeItem(item.productId);
            });

            actions.append(quantityControl, remove);
            content.append(title, category, price, actions);
            card.append(image, content);

            container.appendChild(card);
        });

        updateSummary(subtotal);
        updateCartCount();

    } catch (error) {
        container.textContent =
            "Unable to load cart. Please check your connection and refresh.";
    }
}

function changeQuantity(productId, change, maxStock = Infinity) {
    const cart = readCart();

    const item = cart.find(
        product => product.productId === productId
    );

    if (!item) {
        return;
    }

    const nextQuantity = item.quantity + change;

    if (nextQuantity <= 0) {
        return;
    }

    if (nextQuantity > maxStock) {
        alert("Requested quantity exceeds available stock.");
        return;
    }

    item.quantity = nextQuantity;

    localStorage.setItem("shopEaseCart", JSON.stringify(cart));
    refreshCart();
}

function removeItem(productId) {
    const cart = readCart().filter(
        item => item.productId !== productId
    );

    localStorage.setItem("shopEaseCart", JSON.stringify(cart));
    refreshCart();
}

function updateSummary(subtotal) {
    const shipping = subtotal > 0 ? 0 : 0;

    document.getElementById("subtotal").textContent = money(subtotal);
    document.getElementById("shipping").textContent =
        shipping === 0 && subtotal > 0 ? "FREE" : money(shipping);

    document.getElementById("total").textContent =
        money(subtotal + shipping);

    document.getElementById("checkoutButton").disabled = subtotal <= 0;
}

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (readCart().length === 0) {
        alert("Your cart is empty.");
        return;
    }

    if (!localStorage.getItem("token")) {
        alert("Please login before checkout.");
        window.location.href = "login.html";
        return;
    }

    window.location.href = "checkout.html";
});

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    refreshCart();
});