const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\DevProjects\\fitsphere-server';
const srcDir = path.join(rootDir, 'src');

const dirs = [
  'config',
  'middlewares',
  'modules/users',
  'modules/trainerApplications',
  'modules/classes',
  'modules/bookings',
  'modules/payments',
  'modules/favorites',
  'modules/forum',
  'modules/comments',
  'routes'
];

dirs.forEach(d => {
  const fullPath = path.join(srcDir, d);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Write DB
const dbContent = `const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db("fitsphereDB"); // You can change this DB name later
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not connected!");
  }
  return db;
};

module.exports = { connectDB, getDB };
`;
fs.writeFileSync(path.join(srcDir, 'config', 'db.js'), dbContent);

// Middlewares
const mwContent = `// Middleware placeholder
module.exports = (req, res, next) => {
  // Add your middleware logic here
  next();
};
`;
['verifyToken.js', 'verifyAdmin.js', 'verifyTrainer.js'].forEach(file => {
  fs.writeFileSync(path.join(srcDir, 'middlewares', file), mwContent);
});

// Better Auth Setup Placeholder
fs.writeFileSync(path.join(srcDir, 'config', 'betterAuth.js'), `// Placeholder for Better Auth configuration\nmodule.exports = {};\n`);

// Modules
const modules = [
  'users', 
  'trainerApplications', 
  'classes', 
  'bookings', 
  'payments', 
  'favorites', 
  'forum', 
  'comments'
];

modules.forEach(mod => {
  const routeContent = `const express = require('express');
const router = express.Router();
const controller = require('./${mod}.controller');

// Define routes here, e.g.:
// router.get('/', controller.getAll);

module.exports = router;
`;
  const controllerContent = `const service = require('./${mod}.service');

// Controller logic goes here
// const getAll = async (req, res) => { ... }

module.exports = {};
`;
  const serviceContent = `const { getDB } = require('../../config/db');

// Business logic and database queries go here
// const getAll = async () => { ... }

module.exports = {};
`;
  
  fs.writeFileSync(path.join(srcDir, 'modules', mod, `${mod}.route.js`), routeContent);
  fs.writeFileSync(path.join(srcDir, 'modules', mod, `${mod}.controller.js`), controllerContent);
  fs.writeFileSync(path.join(srcDir, 'modules', mod, `${mod}.service.js`), serviceContent);
});

// Central Router
let routesImport = modules.map(mod => `const ${mod}Routes = require('../modules/${mod}/${mod}.route');`).join('\n');
let routesUse = modules.map(mod => `router.use('/${mod}', ${mod}Routes);`).join('\n');

const routesContent = `const express = require('express');
const router = express.Router();

${routesImport}

// Mount all module routes under specific paths
${routesUse}

module.exports = router;
`;
fs.writeFileSync(path.join(srcDir, 'routes', 'index.js'), routesContent);

// Main Index.js
const indexContent = `const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./src/config/db");
const routes = require("./src/routes");

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Central Routes setup
app.use("/api/v1", routes);

// Root end-point
app.get("/", (req, res) => {
  res.send("FitSphere Server is running");
});

// Global Error Handler & 404 Route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "API Not Found" });
});

app.listen(port, () => {
  console.log(\`FitSphere Server is running on port \${port}\`);
});
`;
fs.writeFileSync(path.join(rootDir, 'index.js'), indexContent);

console.log('Setup script finished successfully.');
