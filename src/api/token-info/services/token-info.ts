/**
 * token-info service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::token-info.token-info',({strapi}) => ({
  async getTokensInfo(chain: number){
    const { tokens } = await strapi.$inch.loadInfoAboutTokens(chain);
    const blockchains = await strapi.db.query('api::blockchain.blockchain').findMany();

    for (const token of tokens) {
      const exist = await strapi.db.query('api::token-info.token-info').findOne({
        where: {
          address: token.address,
          blockchain: {
            chain: token.chainId
          }
        }
      });
      if (exist) {
        continue
      }
      await strapi.db.query('api::token-info.token-info').create({
        data: {
          blockchain: {
            id: (blockchains.find(el => el.chain === token.chainId)).id
          },
          "address": token.address,
          "name": token.name,
          "decimals": token.decimals,
          "symbol": token.symbol,
          "logoURI": token.logoURI,
        }
      })
    }
  }
}));
