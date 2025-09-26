import Web3Utils from "web3-utils";

export const isValidEVMAddress = (address: string): boolean => {
  return Web3Utils.isAddress(address);
}
