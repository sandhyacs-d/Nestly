import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password){
    const hash = await bcrypt.hash(password,SALT_ROUNDS);

    return hash;
}

export async function verifyPassword(password,hash){
    const isMatch = await bcrypt.compare(password,hash);

    return isMatch;
}