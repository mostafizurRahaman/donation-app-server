// import { Router } from 'express';
// import { ROLE } from '../Auth/auth.constant';
// import { AdminController } from './admin.controller';
// import { auth } from '../../middlewares';

// const router = Router();

// // // changeStatusOnFolder
// // router
// //   .route('/folders/:id')
// //   .patch(
// //     auth(ROLE.SUPER_ADMIN, ROLE.ADMIN),
// //     AdminController.changeStatusOnFolder
// //   );

// // router
// //   .route('/dashboard/yearly-revenue')
// //   .get(
// //     auth(ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.ARTIST),
// //     AdminController.getYearlyRevenueStats
// //   );

// // verifyArtistByAdmin
// router
//   .route('/verify-a/:Id')
//   .patch(auth(ROLE.ADMIN), AdminController.verifyArtistByAdmin);

// // verifyBusinessByAdmin
// router
//   .route('/verify-b/:Id')
//   .patch(auth(ROLE.ADMIN), AdminController.verifyBusinessByAdmin);

// // fetchAllArtists
// router.route('/fetch-artists').get(AdminController.fetchAllArtists);

// // fetchAllBusinesses
// router.route('/fetch-businesses').get(AdminController.fetchAllBusinesses);

// // fetchAllClients
// router.route('/fetch-clients').get(AdminController.fetchAllClients);

// export const AdminRoutes = router;
