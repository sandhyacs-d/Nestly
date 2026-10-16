import express from "express";
import testRouter from "./routes/testRoutes.js";
import authRouter from "./routes/authRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import usersRouter from "./routes/usersRoutes.js";
import favoriteRouter from "./routes/favoritesRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import roommateRouter from "./routes/roommateProfileRoutes.js";
import roommateRequestRoutes from "./routes/roommateRequestRoutes.js";
import conversationRouter from "./routes/conversationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/api/test",testRouter);
app.use("/api/auth",authRouter);

app.use("/api/properties",propertyRouter);

app.use("/api/users",usersRouter);

app.use("/api/favorites",favoriteRouter);

app.use("/api/enquiries", enquiryRoutes);

app.use("/api/roommate-profiles",roommateRouter);

app.use("/api/roommate-requests", roommateRequestRoutes);

app.use("/api/conversations",conversationRouter);

app.use(errorHandler);

export default app;

