import { Router } from 'express';
import { auth } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { notificationController } from './notification.controller';

const router = Router();

router.get(
  '/me',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  notificationController.getNotifications
);

router.patch(
  '/mark-notification',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  notificationController.markAsSeen
);

router.get(
  '/unseen-notification-count/:id',
  auth(ROLE.ARTIST, ROLE.CLIENT),
  notificationController.getUnseenNotificationCount
);

export const notificationRoutes = router;
