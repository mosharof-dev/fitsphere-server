const express = require('express');
const router = express.Router();

const usersRoutes = require('../modules/users');
const trainerApplicationsRoutes = require('../modules/trainerApplications');
const classesRoutes = require('../modules/classes');
const bookingsRoutes = require('../modules/bookings');
const paymentsRoutes = require('../modules/payments');
const favoritesRoutes = require('../modules/favorites');
const forumRoutes = require('../modules/forum');
const commentsRoutes = require('../modules/comments');

// Mount all module routes
router.use('/users', usersRoutes);
router.use('/trainerApplications', trainerApplicationsRoutes);
router.use('/classes', classesRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/forum', forumRoutes);
router.use('/comments', commentsRoutes);

module.exports = router;
