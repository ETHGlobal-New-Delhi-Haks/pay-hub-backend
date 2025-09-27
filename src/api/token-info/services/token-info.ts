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
  },

  async updatePriceToUSD() {
    try {
      // Get All Tokens
      const blockchainsWithTokens = await strapi.db.query('api::blockchain.blockchain').findMany({
        populate: {
          token_infos: true
        }
      });

      for (const blockchain of blockchainsWithTokens) {
        const tokenAddresses = blockchain.token_infos.map(el => el.address);

        if (tokenAddresses.length === 0) {
          continue;
        }

        const priceData = await strapi.$inch.loadTokenPrice(blockchain.chain, tokenAddresses);

        if (priceData && Object.keys(priceData).length > 0) {
          await this.updateTokenPricesBulk(priceData);
        }
      }

      console.log('All prices have been successfully updated');
    } catch (error) {
      console.error('Error when updating prices:', error);
      throw error;
    }
  },

  async updateTokenPricesBulk(priceData) {
    const knex = strapi.db.connection;

    const cases = Object.entries(priceData)
      .map(([address, price]) => {
        const roundedPrice = this.roundPrice(price);
        return `WHEN address = '${address}' THEN ${roundedPrice}`;
      })
      .join(' ');

    const addresses = Object.keys(priceData)
      .map(addr => `'${addr}'`)
      .join(',');

    const query = `
    UPDATE token_infos
    SET price_usd = CASE
      ${cases}
      ELSE price_usd
    END,
    updated_at = NOW()
    WHERE address IN (${addresses})
  `;

    try {
      await knex.raw(query);
    } catch (error) {
      console.error('Error while updated price:', error);
      throw error;
    }
  },

  roundPrice(price) {
    const numPrice = parseFloat(price);

    if (price === null || price === undefined || isNaN(numPrice) || numPrice < 0) {
      return 0;
    }

    if (numPrice >= 0.95 && numPrice <= 1.05) {
      return Math.round(numPrice);
    }

    if (numPrice < 0.001) {
      return Math.round(numPrice * 100000000) / 100000000;
    } else if (numPrice < 0.01) {
      return Math.round(numPrice * 1000000) / 1000000;
    } else if (numPrice < 0.1) {
      return Math.round(numPrice * 100000) / 100000;
    } else if (numPrice < 1) {
      return Math.round(numPrice * 10000) / 10000;
    } else if (numPrice < 100) {
      return Math.round(numPrice * 1000) / 1000;
    } else {
      return Math.round(numPrice * 100) / 100;
    }
  }
}));
