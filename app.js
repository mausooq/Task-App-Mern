const express = require('express');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes')
const taskRoutes = require('./routes/taskRoutes')
const cors = require("cors");

const app = express()
connectDB()

app.use(cors()); 
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes);

app.listen(process.env.PORT,()=> {
    console.log('Server is running ')
})