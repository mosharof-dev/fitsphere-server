# 🏋️‍♂️ FitSphere - Fitness & Gym Management Platform (Server)

## 📌 Project Overview

This is the backend server for **FitSphere**, a comprehensive fitness and gym management platform. It handles API requests, database operations, user authentication, role-based access control, and secure payment processing for the client application.

## 🔗 Live Links

- **Server API URL:** [https://fitsphere-server.vercel.app](https://fitsphere-server.vercel.app)
- **Live Client Website:** [https://fitsphere-client.vercel.app](https://fitsphere-client.vercel.app)
- **Server Repository:** [https://github.com/mosharof-dev/fitsphere-server](https://github.com/mosharof-dev/fitsphere-server)
- **Client Repository:** [https://github.com/mosharof-dev/fitsphere-client](https://github.com/mosharof-dev/fitsphere-client)

## ✨ Key Features

- **RESTful API:** Robust endpoints for managing users, classes, forum posts, and bookings.
- **Secure Authentication & Authorization:** Implements secure authentication logic and custom JWT middleware to protect routes based on user roles (Admin, Trainer, User).
- **Stripe Integration:** Server-side implementation for creating payment intents to process secure transactions.
- **Database Management:** Efficient integration with MongoDB to store and retrieve application data.
- **Advanced Querying:** Implements `$regex` for search and `$in` for filtering functionalities.
- **Pagination Support:** Server-side pagination for Community Forum and All Classes endpoints to optimize performance.
- **CORS Handling:** Configured to allow secure cross-origin requests from the client.

## 🛠️ Built With (Dependencies)

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/) (`express`)
- **Database:** [MongoDB](https://www.mongodb.com/) Node.js Driver (`mongodb`)
- **Authentication:** [JSON Web Tokens](https://jwt.io/) (`jsonwebtoken`)
- **Payments:** [Stripe](https://stripe.com/) (`stripe`)
- **Middleware:** `cors`, `cookie-parser`, `dotenv`

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your machine. You will also need a MongoDB database cluster.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mosharof-dev/fitsphere-server.git
   ```
2. Navigate into the directory:
   ```bash
   cd fitsphere-server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory and secure your configuration keys:

```env
PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
ACCESS_TOKEN_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
# Add any other required environment variables
```

### Running the Application

Start the server:

```bash
node index.js
```

The server will run on the specified port (default: 5000).

## 🔑 Admin Credentials for Evaluation

- **Admin Email:** admin@gmail.com
- **Admin Password:** Mosharof1
