import meRoutes from './me';
import commonRoutes from './common';

export default {
  type: 'content-api',
  routes: [...meRoutes, ...commonRoutes],
};
