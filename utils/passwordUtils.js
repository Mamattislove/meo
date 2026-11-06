import bcryptjs from "bcryptjs";

export async function hashPassword(password) {
    const salt = await bcryptjs.genSalt(10);
    return bcryptjs.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
    return bcryptjs.compare(password, hashedPassword);
}
