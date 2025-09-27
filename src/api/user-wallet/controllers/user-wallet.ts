/**
 * user-wallet controller
 */

import {factories} from '@strapi/strapi'
import {isValidEVMAddress} from "../../../utils/validation/wallet/evm";
import {isValidSolanaAddress} from "../../../utils/validation/wallet/solana";
import {isValidFlowAddress} from "../../../utils/validation/wallet/flow";
import {tokensState} from "../../../../database/memory-cache";

export default factories.createCoreController('api::user-wallet.user-wallet', ({strapi}) => ({
  async addWallet(ctx) {
    const user = ctx.state.user;
    const {type, wallet} = ctx.request.body;

    if (!type || !wallet) return ctx.badRequest('Missing type or wallet');

    // EVM //Solana //Flow
    if (!['evm', 'solana', 'flow'].includes(type)) return ctx.badRequest('Incorrect type');

    switch (type) {
      case 'evm':
        if (!isValidEVMAddress(wallet)) {
          return ctx.badRequest('Incorrect wallet');
        }
        break;
      case 'solana':
        if (!isValidSolanaAddress(wallet)) {
          return ctx.badRequest('Incorrect wallet');
        }
        break
      case 'flow':
        if (!isValidFlowAddress(wallet)) {
          return ctx.badRequest('Incorrect wallet');
        }
    }

    const exist = await strapi.db.query('api::user-wallet.user-wallet').findOne({
      where: {
        address: wallet
      }
    });

    if (exist) return ctx.badRequest('Wallet already exists');

    await strapi.db.query('api::user-wallet.user-wallet').create({
      data: {
        address: wallet,
        type,
        user: {
          id: user.id,
        }
      }
    })

    return {
      status: 'ok'
    }
  },

  async getMyWallets(ctx) {
    const user = ctx.state.user;

    const {results, pagination}  = await strapi.service('api::user-wallet.user-wallet').find({
      filters: {
        user: {id: user.id}
      }
    })

    return this.transformResponse(results, {pagination});
  },

  async getBalances(ctx) {
    const user = ctx.state.user;

    const wallets = await strapi.db.query('api::user-wallet.user-wallet').findMany({
        where: {
          user: user.id
        }
    });

    const balances = {};
    for (const wallet of wallets) {
     // balances[wallet.address] = await strapi.$inch.loadTokensFromUser(wallet.type , wallet.address)
      const data = await strapi.$inch.loadTokensFromUser(wallet.type , wallet.address);
      for (const network in data) {
        for (const tokenAddress in data[network]) {
          data[network][tokenAddress] = {
            balance: data[network][tokenAddress],
            data: {
              ...tokensState.tokens.get(`${network}_${tokenAddress}`),
            }
          }
        }
        balances[wallet.address] = data
      }
    }

    return balances;
  }
}));
