const Shift = require('../models/Shift');

// @desc    Get all shifts
// @route   GET /api/shift
// @access  Private/Admin
const getShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: shifts.length, data: shifts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new shift
// @route   POST /api/shift
// @access  Private/Admin
const createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a shift
// @route   PUT /api/shift/:id
// @access  Private/Admin
const updateShift = async (req, res, next) => {
  try {
    let shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};

// @desc    Enable/Disable a shift
// @route   PUT /api/shift/:id/status
// @access  Private/Admin
const updateShiftStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status (Active or Inactive)' });
    }

    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};

const User = require('../models/User');

// @desc    Get employees assigned to a shift
// @route   GET /api/shift/:id/employees
// @access  Private/Admin
const getShiftEmployees = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    const employees = await User.find({ shift: req.params.id, role: 'employee' }).select('-password');
    res.status(200).json({ success: true, employees });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign employees to a shift
// @route   POST /api/shift/:id/assign
// @access  Private/Admin
const assignEmployees = async (req, res, next) => {
  try {
    const { employeeIds } = req.body;
    const shiftId = req.params.id;

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ success: false, message: 'employeeIds must be an array' });
    }

    // Unassign users who were on this shift but are not in the new list
    await User.updateMany(
      { shift: shiftId, _id: { $nin: employeeIds }, role: 'employee' },
      { $set: { shift: null } }
    );

    // Assign the new list to this shift
    if (employeeIds.length > 0) {
      await User.updateMany(
        { _id: { $in: employeeIds }, role: 'employee' },
        { $set: { shift: shiftId } }
      );
    }

    res.status(200).json({ success: true, message: 'Employees assigned successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  updateShiftStatus,
  getShiftEmployees,
  assignEmployees
};
