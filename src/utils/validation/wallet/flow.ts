export const isValidFlowAddress = (address: string): boolean => {
  let x = address.trim();
  if (x.startsWith("0x") || x.startsWith("0X")) x = x.slice(2);
  return /^[0-9a-fA-F]{1,16}$/.test(x);
}
