require("dotenv").config();
const express = require("express");
const { createClient } = require("redis");

// Connect to Redis
const client = createClient({
  url: process.env.REDIS_URL,
});
client.connect().catch(console.error);

const app = express();
app.use(express.json());

// Middleware to cache data
const cache = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await client.get(id);
    if (data) {
      return res.status(200).json({ data: JSON.parse(data), source: "cache" });
    }
    next();
  } catch (err) {
    console.error("Redis error", err);
    next();
  }
};

// Create (POST)
app.post("/data", async (req, res) => {
  const { id, name, value } = req.body;
  const data = { id, name, value };
  await client.set(id, JSON.stringify(data));
  res.status(201).json({ data });
});

// Read (GET) with caching
app.get("/data/:id", cache, async (req, res) => {
  const id = req.params.id;
  const data = { id, name: "Example", value: 42 }; // Normally, get this from a database
  await client.set(id, JSON.stringify(data)); // Store in cache
  res.status(200).json({ data, source: "database" });
});

// Update (PUT)
app.put("/data/:id", async (req, res) => {
  const { name, value } = req.body;
  const id = req.params.id;
  const data = { id, name, value };
  await client.set(id, JSON.stringify(data));
  res.status(200).json({ data });
});

// Delete (DELETE)
app.delete("/data/:id", async (req, res) => {
  const id = req.params.id;
  await client.del(id);
  res.status(200).json({ message: "Data deleted" });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
