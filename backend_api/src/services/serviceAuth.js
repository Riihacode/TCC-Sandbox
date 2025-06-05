import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
};