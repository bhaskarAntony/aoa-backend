import express from 'express';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import AccommodationBooking from '../models/AccommodationBooking.js';
import Accommodation from '../models/Accommodation.js';
import Abstract from '../models/Abstract.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Dashboard analytics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Registration statistics
    const totalRegistrations = await Registration.countDocuments();
    const paidRegistrations = await Registration.countDocuments({ paymentStatus: 'PAID' });
    const pendingRegistrations = await Registration.countDocuments({ paymentStatus: 'PENDING' });

    // Role-based statistics
    const registrationsByRole = await Registration.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.role',
          count: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
          }
        }
      }
    ]);

    // Booking phase statistics
    const registrationsByPhase = await Registration.aggregate([
      {
        $group: {
          _id: '$bookingPhase',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0] } }
        }
      }
    ]);

    // Revenue statistics
    const totalRevenue = await Registration.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const accommodationRevenue = await AccommodationBooking.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Recent payments
    const recentPayments = await Payment.find({ status: 'SUCCESS' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pending payments
    const pendingPayments = await Payment.find({ status: 'PENDING' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Abstract statistics
    const abstractStats = await Abstract.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Feedback statistics
    const totalFeedback = await Feedback.countDocuments();

    res.json({
      registrations: {
        total: totalRegistrations,
        paid: paidRegistrations,
        pending: pendingRegistrations,
        byRole: registrationsByRole,
        byPhase: registrationsByPhase
      },
      revenue: {
        registration: totalRevenue[0]?.total || 0,
        accommodation: accommodationRevenue[0]?.total || 0,
        total: (totalRevenue[0]?.total || 0) + (accommodationRevenue[0]?.total || 0)
      },
      recentPayments,
      pendingPayments,
      abstracts: abstractStats,
      feedback: {
        total: totalFeedback
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registrations
router.get('/registrations', authenticateAdmin, async (req, res) => {
  try {
    const { status, role, phase } = req.query;
    let filter = {};

    if (status) filter.paymentStatus = status;
    if (phase) filter.bookingPhase = phase;

    const registrations = await Registration.find(filter)
      .populate('userId', 'name email phone role membershipId')
      .sort({ createdAt: -1 });

    // Filter by role if specified
    let filteredRegistrations = registrations;
    if (role) {
      filteredRegistrations = registrations.filter(reg => reg.userId.role === role);
    }

    res.json(filteredRegistrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments
router.get('/payments', authenticateAdmin, async (req, res) => {
  try {
    const { status, type } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.paymentType = type;

    const payments = await Payment.find(filter)
      .populate('userId', 'name email')
      .populate('registrationId')
      .populate('accommodationBookingId')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create accommodation
router.post('/accommodations', authenticateAdmin, async (req, res) => {
  try {
    const accommodation = new Accommodation(req.body);
    await accommodation.save();

    res.status(201).json({
      message: 'Accommodation created successfully',
      accommodation
    });
  } catch (error) {
    console.error('Create accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update accommodation
router.put('/accommodations/:id', authenticateAdmin, async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json({
      message: 'Accommodation updated successfully',
      accommodation
    });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete accommodation
router.delete('/accommodations/:id', authenticateAdmin, async (req, res) => {
  try {
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accommodation bookings
router.get('/accommodation-bookings', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { paymentStatus: status } : {};

    const bookings = await AccommodationBooking.find(filter)
      .populate('userId', 'name email phone')
      .populate('accommodationId', 'name location')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get accommodation bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;