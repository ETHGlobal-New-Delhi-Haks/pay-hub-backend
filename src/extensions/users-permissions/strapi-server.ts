import routes from "./server/routes";
import controllers from "./server/controllers";
import services from "./server/services";
//
export default (plugin) => {
  plugin.routes = {
    ...plugin.routes,
    routes
  }
  plugin.controllers = {
    ...plugin.controllers,
    ...controllers
  }
  plugin.services = {
    ...plugin.services,
    ...services
  }

  return plugin;
}
