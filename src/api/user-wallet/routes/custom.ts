module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/wallets/my',
      handler: 'api::user-wallet.user-wallet.getMyWallets',
      config: {
        policies: [],
        description: '',
      }
    },
    {
      method: 'POST',
      path: '/wallets/add',
      handler: 'api::user-wallet.user-wallet.addWallet',
      config: {
        policies: [],
        description: '',
      }
    }
  ]
}
