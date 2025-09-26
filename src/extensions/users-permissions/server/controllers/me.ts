export const me = {
    async getBalances() {
      //@ts-ignore
      const data = await strapi.$inch.loadTokens(1, '0x388c818ca8b9251b393131c08a736a67ccb19297');
      return data;
    }
}


export default me;
