export type IToken = {
  id: number
  chainId: number
  address: string
  name: string
  decimals: number
  symbol: string
  logoURI: string
}

export const tokensState = {
  tokens: new Map<string, IToken>(),
};

export const reloadTokenState = async ({ strapi }) => {
  console.log('Reloading tokens into memory...');

  const tokens = await strapi.entityService.findMany('api::token-info.token-info', {
    populate: {
      blockchain: true
    }
  });

  tokensState.tokens.clear();

  for (const token of tokens) {
    tokensState.tokens.set(`${token.blockchain.chain}_${token.address}`, token);
  }
}
