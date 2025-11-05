import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { Router } from 'express';
import { contentZodValidation } from './page.zod';
import { ContentController } from './page.controller';

const router = Router();

router.post(
  '/create-or-update',
  auth(ROLE.ADMIN),
  validateRequest(contentZodValidation.createOrUpdatePageSchema),
  ContentController.createContentOrUpdate
);

// getAllContent
router.get('/retrieve', ContentController.getAllContent);

// getContentByType
router.get('/retrieve/:type', ContentController.getContentByType);

export const contentRoutes = router;
