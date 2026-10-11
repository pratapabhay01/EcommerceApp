const checkoutForm = document.getElementById("checkoutForm");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutMessage = document.getElementById("checkoutMessage");
const placeOrderButton = document.getElementById("placeOrderButton");

function getCheckoutCart() {
    try {
        const cart = JSON.parse(localStorage.getItem("shopEaseCart")) || [];

        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function formatCheckoutPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

async function displayCheckoutSummary() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    const cart = getCheckoutCart();

    if (cart.length === 0) {
        checkoutItems.textContent = "Your cart is empty.";
        placeOrderButton.disabled = true;
        return;
    }

    try {
        const response = await fetch("/api/products");
        const products = await response.json();

        if (!response.ok) {
            throw new Error("Could not load products.");
        }

        const productMap = new Map(
            products.map(product => [product._id, product])
        );

        checkoutItems.replaceChildren();

        let subtotal = 0;
        let validItems = 0;

        for (const item of cart) {
            const product = productMap.get(item.productId);

            if (!product) {
                continue;
            }

            const quantity = Number(item.quantity);

            if (
                !Number.isSafeInteger(quantity) ||
                quantity < 1 ||
                quantity > product.stock
            ) {
                throw new Error(
                    `${product.name} has insufficient stock. Please update your cart.`
                );
            }

            const lineTotal = product.price * quantity;
            subtotal += lineTotal;
            validItems++;

            const row = document.createElement("p");
            row.textContent =
                `${product.name} × ${quantity} — ${formatCheckoutPrice(lineTotal)}`;

            checkoutItems.appendChild(row);
        }

        if (validItems === 0) {
            checkoutItems.textContent =
                "No available products in your cart.";
            placeOrderButton.disabled = true;
            return;
        }

        document.getElementById("checkoutSubtotal").textContent =
            formatCheckoutPrice(subtotal);

        document.getElementById("checkoutTotal").textContent =
            formatCheckoutPrice(subtotal);

        placeOrderButton.disabled = false;

    } catch (error) {
        checkoutItems.textContent = error.message;
        placeOrderButton.disabled = true;
    }
}

checkoutForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const cart = getCheckoutCart();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (cart.length === 0) {
        checkoutMessage.style.color = "crimson";
        checkoutMessage.textContent = "Your cart is empty.";
        return;
    }

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Placing Order...";
    checkoutMessage.textContent = "";

    try {
        const items = cart.map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity)
        }));

        const shippingAddress = {
            fullName: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            pincode: document.getElementById("pincode").value.trim()
        };

        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                items,
                shippingAddress
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to place order.");
        }

        // Clear the cart only after the server confirms the order.
        localStorage.removeItem("shopEaseCart");

        checkoutMessage.style.color = "green";
        checkoutMessage.textContent = "Order placed successfully!";

        window.location.href = "orders.html";

    } catch (error) {
        checkoutMessage.style.color = "crimson";
        checkoutMessage.textContent = error.message;
    } finally {
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place Order";
    }
});

displayCheckoutSummary();