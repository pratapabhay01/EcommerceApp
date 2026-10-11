const ordersList = document.getElementById("ordersList");
const ordersMessage = document.getElementById("ordersMessage");

function formatOrderPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

function formatOrderDate(date) {
    return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getStatusClass(status) {
    const classes = {
        Pending: "",
        Confirmed: "status-confirmed",
        Shipped: "status-shipped",
        Delivered: "status-delivered",
        Cancelled: "status-cancelled"
    };

    return classes[status] || "";
}

function addTextElement(parent, tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    element.textContent = text;
    parent.appendChild(element);

    return element;
}

function renderOrders(orders) {
    ordersList.replaceChildren();

    if (!Array.isArray(orders) || orders.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-orders";

        addTextElement(empty, "h2", "", "No orders yet!");
        addTextElement(
            empty,
            "p",
            "",
            "Your placed orders will appear here."
        );

        const link = document.createElement("a");
        link.href = "index.html";
        link.textContent = "Explore Products";
        empty.appendChild(link);

        ordersList.appendChild(empty);
        return;
    }

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "order-card";

        const top = document.createElement("div");
        top.className = "order-top";

        const orderInfo = document.createElement("div");

        addTextElement(
            orderInfo,
            "h3",
            "",
            `Order #${order._id.slice(-8).toUpperCase()}`
        );

        addTextElement(
            orderInfo,
            "p",
            "order-date",
            `Placed on ${formatOrderDate(order.createdAt)}`
        );

        const status = addTextElement(
            top,
            "span",
            `order-status ${getStatusClass(order.status)}`,
            order.status
        );

        top.prepend(orderInfo);
        card.appendChild(top);

        const productsSection = document.createElement("div");
        productsSection.className = "order-products";

        (order.items || []).forEach(item => {
            const row = document.createElement("div");
            row.className = "order-product";

            addTextElement(
                row,
                "span",
                "",
                `${item.name} × ${item.quantity}`
            );

            addTextElement(
                row,
                "strong",
                "",
                formatOrderPrice(item.price * item.quantity)
            );

            productsSection.appendChild(row);
        });

        card.appendChild(productsSection);

        addTextElement(
            card,
            "div",
            "order-total",
            `Total: ${formatOrderPrice(order.totalAmount)}`
        );

        if (order.shippingAddress) {
            const address = order.shippingAddress;
            const delivery = document.createElement("div");
            delivery.className = "delivery-info";

            addTextElement(
                delivery,
                "h4",
                "",
                "Delivery Address"
            );

            addTextElement(
                delivery,
                "p",
                "",
                `${address.fullName} · ${address.phone}`
            );

            addTextElement(
                delivery,
                "p",
                "",
                `${address.address}, ${address.city} - ${address.pincode}`
            );

            card.appendChild(delivery);
        }

        ordersList.appendChild(card);
    });
}

async function loadOrders() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    try {
        const response = await fetch("/api/orders", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        ordersMessage.textContent = "";
        renderOrders(data);

    } catch (error) {
        ordersMessage.textContent = error.message;
        ordersMessage.style.color = "crimson";
    }
}

loadOrders();