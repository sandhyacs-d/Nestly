import express from "express";
import testRouter from "./routes/testRoutes.js";
import authRouter from "./routes/authRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/api/test",testRouter);
app.use("/api/auth",authRouter);

app.use("/api/properties",propertyRouter);

app.use(errorHandler);

export default app;

