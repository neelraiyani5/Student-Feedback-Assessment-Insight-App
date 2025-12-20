import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 3002;
const app =express();

connectDB();

app.listen(port, () => {
    console.log(`Server running on "http://localhost:${port}"`);
})