const init = require("@strapi/strapi");
const cronTasks = require(`${__dirname}/cronTasks.js`)
const bootstrap = () => {
  setImmediate(bootstrap)
}

const start = async () => {
  const strapi = await init({
    appDir: `${__dirname}/../..`,
    distDir: `${__dirname}/../../dist`
  }).load();
  strapi.cron.add(cronTasks);
}

start()
