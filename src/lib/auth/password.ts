import crypto from "crypto";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";
const PREFIX = "pbkdf2";

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString("base64url");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

  return [PREFIX, DIGEST, ITERATIONS, salt, derivedKey.toString("base64url")].join("$");
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [prefix, digest, iterations, salt, storedKey] = passwordHash.split("$");

  if (prefix !== PREFIX || !digest || !iterations || !salt || !storedKey) {
    return false;
  }

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      Number(iterations),
      KEY_LENGTH,
      digest,
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      }
    );
  });

  const storedBuffer = Buffer.from(storedKey, "base64url");

  return (
    storedBuffer.length === derivedKey.length &&
    crypto.timingSafeEqual(storedBuffer, derivedKey)
  );
};
