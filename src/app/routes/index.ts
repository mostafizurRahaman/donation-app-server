import { Router } from 'express';
// import { AdminRoutes } from '../modules/Admin/admin.route';
// import { BusinessRoutes } from '../modules/Business/business.routes';
import { AuthRoutes } from '../modules/Auth/auth.route';
// import { OrganizationRoutes } from '../modules/Organization/organization.routes';
import { ClientRoutes } from '../modules/Client/client.route';
// import { notificationRoutes } from '../modules/Notification/notification.routes';
import { contentRoutes } from '../modules/Content/content.route';

const router = Router();

const moduleRoutes = [
  // {
  //   path: '/admin',
  //   route: AdminRoutes,
  // },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/client',
    route: ClientRoutes,
  },
  // {
  //   path: '/organization',
  //   route: OrganizationRoutes,
  // },

  // {
  //   path: '/business',
  //   route: BusinessRoutes,
  // },
  // {
  //   path: '/notification',
  //   route: notificationRoutes,
  // },
  {
    path: '/content',
    route: contentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
