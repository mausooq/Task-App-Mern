const express = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

<<<<<<< HEAD
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
=======
const app = express();


connectDB();

app.use(
  cors({
    origin: ["https://task-app-mausooq.netlify.app"],
>>>>>>> c720bec84aac8f618dd02f78903082267e17f870
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle Preflight Requests (OPTIONS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://task-app-mausooq.netlify.app");
  // Other CORS headers you might need
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
