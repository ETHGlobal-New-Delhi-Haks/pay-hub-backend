import { PublicKey } from "@solana/web3.js";

export const isValidSolanaAddress = (address: string, requireOnCurve = true): boolean => {
  try {
    const pk = new PublicKey(address);
    return requireOnCurve ? PublicKey.isOnCurve(pk.toBytes()) : true;
  } catch { return false; }
}
