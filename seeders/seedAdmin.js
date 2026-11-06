// Creates the first admin account from the SEED_ADMIN_* values in .env.
// Run once after setup: npm run seed:admin
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { USER_ROLES } from "../utils/constants.js";

dotenv.config();

const { SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } =
    process.env;

try {
    await mongoose.connect(process.env.MONGO_URL);
    const existing = await User.findOne({ username: SEED_ADMIN_USERNAME });
    if (existing) {
        console.log(`User "${SEED_ADMIN_USERNAME}" already exists - skipped.`);
    } else {
        await User.create({
            username: SEED_ADMIN_USERNAME,
            email: SEED_ADMIN_EMAIL,
            password: await hashPassword(SEED_ADMIN_PASSWORD),
            role: USER_ROLES.ADMIN,
        });
        console.log(`Admin "${SEED_ADMIN_USERNAME}" created.`);
    }
} catch (error) {
    console.log(error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
