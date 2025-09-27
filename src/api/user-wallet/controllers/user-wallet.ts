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
      const data = await strapi.$inch.loadTokensFromUser(wallet.type, wallet.address);

      for (const network in data) {
        const tokensArray = [];

        for (const tokenAddress in data[network]) {
          tokensArray.push({
            tokenAddress,
            balance: data[network][tokenAddress],
            data: {
              ...tokensState.tokens.get(`${network}_${tokenAddress}`),
            }
          });
        }

        tokensArray.sort((a, b) => {
          // Рассчитываем реальный баланс и USD эквивалент для токена A
          const balanceWeiA = parseFloat(a.balance) || 0;
          const decimalsA = parseInt(a.data?.decimals) || 18;
          const realBalanceA = balanceWeiA / Math.pow(10, decimalsA);
          const priceA = parseFloat(a.data?.priceUSD) || 0;
          const valueA = realBalanceA * priceA;

          // Рассчитываем реальный баланс и USD эквивалент для токена B
          const balanceWeiB = parseFloat(b.balance) || 0;
          const decimalsB = parseInt(b.data?.decimals) || 18;
          const realBalanceB = balanceWeiB / Math.pow(10, decimalsB);
          const priceB = parseFloat(b.data?.priceUSD) || 0;
          const valueB = realBalanceB * priceB;

          // Сортируем по убыванию USD стоимости
          return valueB - valueA;
        });

        data[network] = {};
        tokensArray.forEach(token => {
          data[network][token.tokenAddress] = {
            balance: token.balance,
            data: token.data
          };
        });
      }

      balances[wallet.address] = data;
    }

    return balances;
  }
}));
