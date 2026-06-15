const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Database initialization
const db = new sqlite3.Database('./earthly_delights.db', (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT,
        category TEXT,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart table
    db.run(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Seed products if table is empty
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (row.count === 0) {
        seedProducts();
      }
    });
  });
}

// Seed initial products
function seedProducts() {
  const products = [
    {
      name: 'The Imperial Eggplant',
      description: 'Premium deep penetration luxury',
      price: 89.99,
      category: 'Premium',
      stock: 50
    },
    {
      name: 'The Couples\' Cucumber',
      description: 'Synchronized pleasure for two',
      price: 79.99,
      category: 'Couples',
      stock: 45
    },
    {
      name: 'The Silky Peach',
      description: 'Soft external luxury and intimacy',
      price: 69.99,
      category: 'Beginner',
      stock: 60
    },
    {
      name: 'The Bitter Melon',
      description: 'Advanced-only intense experience',
      price: 99.99,
      category: 'Advanced',
      stock: 30
    },
    {
      name: 'The Beginner\'s Zucchini',
      description: 'Beginner-friendly entry product',
      price: 59.99,
      category: 'Beginner',
      stock: 70
    },
    {
      name: 'The Couples\' Carrot',
      description: 'Double penetration specialist',
      price: 85.99,
      category: 'Couples',
      stock: 35
    },
    {
      name: 'The Mighty Plantain',
      description: 'Maximum size enthusiasts',
      price: 109.99,
      category: 'Advanced',
      stock: 25
    },
    {
      name: 'The Exotic Papaya',
      description: 'Luxury connoisseur experience',
      price: 119.99,
      category: 'Luxury',
      stock: 20
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO products (name, description, price, category, stock)
    VALUES (?, ?, ?, ?, ?)
  `);

  products.forEach(product => {
    stmt.run(product.name, product.description, product.price, product.category, product.stock);
  });

  stmt.finalize();
  console.log('Products seeded');
}

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, first_name, last_name],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists or invalid input' });
      }

      const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ 
        message: 'User registered successfully',
        token,
        userId: this.lastID
      });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      message: 'Login successful',
      token,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  });
});

// ==================== PRODUCTS ROUTES ====================

// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// Create product (admin only - no auth check for demo)
app.post('/api/products', (req, res) => {
  const { name, description, price, category, stock } = req.body;

  db.run(
    'INSERT INTO products (name, description, price, category, stock) VALUES (?, ?, ?, ?, ?)',
    [name, description, price, category, stock],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Product created' });
    }
  );
});

// ==================== CART ROUTES ====================

// Get user cart
app.get('/api/cart', verifyToken, (req, res) => {
  db.all(
    `SELECT c.*, p.name, p.price, p.image 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [req.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Add to cart
app.post('/api/cart', verifyToken, (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Product ID and quantity required' });
  }

  db.run(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
    [req.userId, product_id, quantity],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ message: 'Item added to cart', cartId: this.lastID });
    }
  );
});

// Update cart item
app.put('/api/cart/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  db.run(
    'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
    [quantity, id, req.userId],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ message: 'Cart updated' });
    }
  );
});

// Remove from cart
app.delete('/api/cart/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.userId], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Item removed from cart' });
  });
});

// ==================== ORDERS ROUTES ====================

// Create order from cart
app.post('/api/orders', verifyToken, (req, res) => {
  // Get cart items
  db.all(
    `SELECT c.*, p.price FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [req.userId],
    (err, cartItems) => {
      if (err || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      db.run(
        'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
        [req.userId, total, 'pending'],
        function(err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }

          const orderId = this.lastID;

          // Add items to order
          const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
          cartItems.forEach(item => {
            stmt.run(orderId, item.product_id, item.quantity, item.price);
          });
          stmt.finalize();

          // Clear cart
          db.run('DELETE FROM cart WHERE user_id = ?', [req.userId], (err) => {
            res.json({ 
              message: 'Order created successfully',
              orderId,
              total
            });
          });
        }
      );
    }
  );
});

// Get user orders
app.get('/api/orders', verifyToken, (req, res) => {
  db.all(
    `SELECT o.*, 
            COUNT(oi.id) as item_count
     FROM orders o 
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get order details
app.get('/api/orders/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT oi.*, p.name, p.description
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/users/profile', verifyToken, (req, res) => {
  db.get(
    'SELECT id, email, first_name, last_name, phone, bio, created_at FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update user profile
app.put('/api/users/profile', verifyToken, (req, res) => {
  const { first_name, last_name, phone, bio } = req.body;

  db.run(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, bio = ? WHERE id = ?',
    [first_name, last_name, phone, bio, req.userId],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🌸 Earthly Delights Backend running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/products');
  console.log('  POST   /api/cart');
  console.log('  GET    /api/cart');
  console.log('  POST   /api/orders');
  console.log('  GET    /api/orders');
  console.log('  GET    /api/users/profile');
  console.log('  PUT    /api/users/profile');
});

module.exports = app;
