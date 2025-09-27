const {Mutex} = require("async-mutex");

const globalMutex = new Mutex();

module.exports = {
  "0 */1 * * *": async ({strapi}) => {
    const release = await globalMutex.acquire();
    try {
      await strapi.service('api::token-info.token-info').updatePriceToUSD();
    } catch (e) {
      console.log('Cant update USD rate')
    } finally {
      release();
    }
  }
}
