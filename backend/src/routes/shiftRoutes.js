const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getShifts,
  createShift,
  updateShift,
  updateShiftStatus,
  getShiftEmployees,
  assignEmployees
} = require('../controllers/shiftController');

// Apply protection and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getShifts)
  .post(createShift);

router.route('/:id')
  .put(updateShift);

router.route('/:id/status')
  .put(updateShiftStatus);

router.route('/:id/employees')
  .get(getShiftEmployees);

router.route('/:id/assign')
  .post(assignEmployees);

module.exports = router;
