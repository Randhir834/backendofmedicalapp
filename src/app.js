// app.js
 //
 // Creates and configures the Express application.
 //
 // Responsibilities:
 // - Register global middlewares (CORS, JSON body parsing, request logging)
 // - Mount the main API router
 // - Provide a basic health endpoint
 // - Handle 404s and errors
import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Global middlewares.
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Mount all API routes.
app.use(routes);

// Basic health check.
app.get("/", (req, res) => {
  res.send("TPEx Healthcare Backend Running ✅");
});

// Fallback handler for unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler.
app.use(errorMiddleware);

export default app;
