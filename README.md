# 🌸 Earthly Delights - E-Commerce Platform

A sensual, luxury e-commerce platform for adult wellness products with a full-stack implementation.

## 📋 Features

- **Frontend**: Responsive HTML5/CSS3 with smooth animations
- **Backend**: Node.js + Express API
- **Database**: SQLite3 for data persistence
- **Authentication**: JWT-based user authentication with bcrypt hashing
- **E-Commerce**: Full shopping cart and order management system
- **User Accounts**: Profile management and order history

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start the backend server**:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (admin)

#### Shopping Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart` - Add item to cart (requires auth)
- `PUT /api/cart/:id` - Update cart item quantity (requires auth)
- `DELETE /api/cart/:id` - Remove item from cart (requires auth)

#### Orders
- `POST /api/orders` - Create order from cart (requires auth)
- `GET /api/orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)

#### User Profile
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

#### Health Check
- `GET /api/health` - Check if backend is running

## 📚 API Usage Examples

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get All Products
```bash
curl http://localhost:5000/api/products
```

### Add to Cart (requires token)
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

### Create Order (requires token)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique email address
- `password`: Hashed password
- `first_name`: User's first name
- `last_name`: User's last name
- `phone`: Contact phone
- `bio`: User bio
- `created_at`: Registration timestamp

### Products Table
- `id`: Primary key
- `name`: Product name
- `description`: Product description
- `price`: Product price
- `image`: Image URL
- `category`: Product category
- `stock`: Available stock
- `created_at`: Creation timestamp

### Cart Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `product_id`: Foreign key to products
- `quantity`: Item quantity
- `added_at`: When added to cart

### Orders Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `total_price`: Order total
- `status`: Order status (pending, shipped, delivered)
- `created_at`: Order timestamp

### Order Items Table
- `id`: Primary key
- `order_id`: Foreign key to orders
- `product_id`: Foreign key to products
- `quantity`: Item quantity
- `price`: Price at time of order

## 🔐 Security

- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- Protected routes require valid JWT token in Authorization header
- CORS enabled for frontend communication

## 🎨 Frontend Integration

The frontend pages can now connect to the backend:

1. **Login**: POST to `/api/auth/login` with email/password
2. **Cart**: GET `/api/cart` to fetch, POST to add items
3. **Orders**: POST to `/api/orders` to checkout, GET to view history
4. **Profile**: GET/PUT `/api/users/profile` to manage account

## 📝 Environment Variables

Create a `.env` file with:
```
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🚀 Deployment

For production deployment:
1. Change `JWT_SECRET` to a strong random string
2. Set `NODE_ENV=production`
3. Use a production database (PostgreSQL recommended)
4. Add HTTPS/SSL certificates
5. Configure CORS for your domain

## 📦 Dependencies

- **express**: Web framework
- **sqlite3**: Database
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin requests
- **body-parser**: JSON parsing
- **dotenv**: Environment variables
- **nodemon**: Auto-restart during development (dev)

## 📄 License

ISC License

---

**Earthly Delights** 🌸 - Crafted with passion and privacy in mind.
