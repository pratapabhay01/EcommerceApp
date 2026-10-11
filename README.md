# ShopEase – Full Stack E-Commerce Web Application

ShopEase is a full-stack e-commerce web application that allows users to browse products, manage their shopping cart, place orders, and track order status. It also includes an admin dashboard for product and order management.

## 🌐 Live Demo

[Visit ShopEase](https://ecommerce-1aatqnbvg-abhay-portfolio3.vercel.app)

## 📂 GitHub Repository

[View Source Code](https://github.com/pratapabhay01/EcommerceApp)

## ✨ Features

### User Features
- User registration and login
- Secure password hashing
- JWT-based authentication
- Product browsing
- Shopping cart management
- Checkout and order placement
- Order history

### Admin Features
- Admin dashboard
- Add new products
- Edit product details
- Delete products
- View customer orders
- Update order status

## 🛠️ Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- REST APIs

**Database**
- MongoDB Atlas
- Mongoose

**Authentication & Security**
- JSON Web Tokens (JWT)
- bcryptjs

**Deployment & Version Control**
- Vercel
- Git and GitHub

## 📁 Project Structure

```text
EcommerceApp/
├── middleware/
├── models/
├── routes/
├── public/
├── server.js
├── package.json
├── package-lock.json
├── vercel.json
└── .gitignore
```

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/pratapabhay01/EcommerceApp.git
cd EcommerceApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=3000
```

Replace the placeholder values with your own credentials. Never upload your `.env` file to GitHub.

### 4. Start the server

```bash
node server.js
```

Open `http://localhost:3000` in your browser.

## 🔐 Security Notes

- Passwords are hashed before storage.
- Protected routes use JWT authentication.
- Administrative operations require admin authorization.
- Database credentials and secret keys should be stored in environment variables.

## 🎯 Project Objective

The objective of ShopEase is to demonstrate full-stack web development skills by integrating frontend interfaces, backend APIs, database operations, authentication, and administrative functionality into one application.

## 👨‍💻 Developer

**Abhay Pratap**

GitHub: [pratapabhay01](https://github.com/pratapabhay01)

---

*Developed as a full-stack web development project.*