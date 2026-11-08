import { generateKeyPair, exportPKCS8, exportJWK } from "jose";

export async function generateJwtKeys(): Promise<{
  JWT_PRIVATE_KEY: string;
  JWKS: string;
}> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });

  const JWT_PRIVATE_KEY = await exportPKCS8(privateKey);

  const jwk = await exportJWK(publicKey);
  const JWKS = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });

  return { JWT_PRIVATE_KEY, JWKS };
}
