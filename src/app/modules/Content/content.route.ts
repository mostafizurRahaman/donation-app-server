import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { Router } from 'express';
import { contentZodValidation } from './content.zod';
import { ContentController } from './content.controller';

const router = Router();

router.post(
  '/create-or-update',
  auth(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest(contentZodValidation.createOrUpdatePageSchema),
  ContentController.createContentOrUpdate
);

// getAllContent
router.get('/retrieve', ContentController.getAllContent);

// getContentByType
router.get('/retrieve/:type', ContentController.getContentByType);

export const contentRoutes = router;
