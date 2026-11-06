import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
import mongoose from "mongoose";
import "express-async-errors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import errorHandlerMiddleware from "./middlewares/errorHandlerMiddleware.js";
import { authenticateUser } from "./middlewares/authMiddleware.js";
import { getUploadDir } from "./middlewares/uploadMiddleware.js";

import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";
import businessRouter from "./routers/businessRouter.js";
import annualInspectionRouter from "./routers/annualInspectionRouter.js";
import buildingPermitRouter from "./routers/buildingPermitRouter.js";
import electricalPermitRouter from "./routers/electricalPermitRouter.js";
import inspectionRouter from "./routers/inspectionRouter.js";
import assessmentRouter from "./routers/assessmentRouter.js";

dotenv.config();
const app = express();

// Behind Cloudflare Tunnel (or another proxy), set TRUST_PROXY=1 so req.ip is the
// visitor's real IP and the login rate limiter doesn't treat everyone as one user.
if (process.env.TRUST_PROXY) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY));
}

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/test", (req, res) => {
    res.json({ msg: "test routes" });
});

// Locally uploaded images (e.g. business documents). Logged-in users only, and
// marked private so proxies like Cloudflare never cache and re-serve them.
app.use(
    "/uploads",
    authenticateUser,
    express.static(getUploadDir(), {
        setHeaders: (res) => res.set("Cache-Control", "private, no-store"),
    })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", authenticateUser, userRouter);
app.use("/api/v1/businesses", authenticateUser, businessRouter);
app.use("/api/v1/annual-inspections", authenticateUser, annualInspectionRouter);
app.use("/api/v1/building-permits", authenticateUser, buildingPermitRouter);
app.use("/api/v1/electrical-permits", authenticateUser, electricalPermitRouter);
app.use("/api/v1/inspections", authenticateUser, inspectionRouter);
app.use("/api/v1/assessments", authenticateUser, assessmentRouter);

// Unknown API paths get a JSON 404 instead of falling through to the SPA.
app.use("/api/*", (req, res) => {
    res.status(404).json({ msg: "route not found" });
});

// Serve React build in production
app.use(express.static(path.resolve(__dirname, "client/dist")));

// SPA fallback - must come after all /api routes
app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client/dist", "index.html"));
});

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 5100;
try {
    await mongoose.connect(process.env.MONGO_URL);
    app.listen(PORT, () => {
        console.log(`Listening on PORT: ${PORT}`);
    });
} catch (error) {
    console.log(error);
    process.exit(1);
}
