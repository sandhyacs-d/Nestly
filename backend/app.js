import express from "express";
import cors from "cors";
import helmet from "helmet";
import testRouter from "./routes/testRoutes.js";
import authRouter from "./routes/authRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import usersRouter from "./routes/usersRoutes.js";
import favoriteRouter from "./routes/favoritesRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import roommateRouter from "./routes/roommateProfileRoutes.js";
import roommateRequestRoutes from "./routes/roommateRequestRoutes.js";
import conversationRouter from "./routes/conversationRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json({ limit: "10kb" }));

app.use("/api", apiLimiter);


app.use("/api/test",testRouter);
app.use("/api/auth",authRouter);

app.use("/api/properties",propertyRouter);

app.use("/api/users",usersRouter);

app.use("/api/favorites",favoriteRouter);

app.use("/api/enquiries", enquiryRoutes);

app.use("/api/roommate-profiles",roommateRouter);

app.use("/api/roommate-requests", roommateRequestRoutes);

app.use("/api/conversations",conversationRouter);

app.use("/api/notifications",notificationRouter);

app.use("/api/admin", adminRouter);

app.use(errorHandler);

export default app;

