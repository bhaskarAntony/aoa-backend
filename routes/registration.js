import express from 'express';
import Registration from '../models/Registration.js';
import { authenticateUser } from '../middleware/auth.js';
import { getBookingPhase, calculatePrice } from '../utils/pricing.js';
import { generateLifetimeMembershipId } from '../utils/membershipGenerator.js';
import multer from 'multer';

const router = express.Router();

// Configure Multer (store files in memory for now)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST route with multer middleware
router.post(
  '/',
  authenticateUser,
  upload.fields([
    { name: 'registrationType', maxCount: 1 },  // text field
    { name: 'collegeLetter', maxCount: 1 },     // optional file
  ]),
  async (req, res) => {
    try {
      // Now req.body will have registrationType
      console.log('Received body:', req.body);
      // Example output: { registrationType: 'WORKSHOP_CONFERENCE' }

      if (req.files && req.files.collegeLetter) {
        console.log('Uploaded file:', req.files.collegeLetter[0].originalname);
      }

      const { registrationType } = req.body;

      if (!registrationType) {
        return res.status(400).json({ message: 'Registration type is required' });
      }

      const userId = req.user._id;

      // Check existing registration
      const existingRegistration = await Registration.findOne({ userId });
      if (existingRegistration) {
        return res.status(400).json({ message: 'User already has a registration' });
      }

      const bookingPhase = getBookingPhase();
      const pricing = calculatePrice(req.user.role, registrationType, bookingPhase);

      const registration = new Registration({
        userId,
        registrationType,
        bookingPhase,
        ...pricing,
        lifetimeMembershipId: registrationType === 'COMBO' ? generateLifetimeMembershipId() : undefined,
      });

      await registration.save();

      await registration.populate('userId', 'name email role');

      res.status(201).json({
        message: 'Registration created successfully',
        registration,
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation failed',
          errors: Object.values(error.errors).map(e => e.message),
        });
      }
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// Get user's registration
router.get('/my-registration', authenticateUser, async (req, res) => {
  try {
    const registration = await Registration.findOne({ userId: req.user._id })
      .populate('userId', 'name email role membershipId');

    if (!registration) {
      return res.status(404).json({ message: 'No registration found' });
    }

    res.json(registration);
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pricing info
router.get('/pricing', authenticateUser, async (req, res) => {
  try {
    const bookingPhase = getBookingPhase();
    
    const conferenceOnly = calculatePrice(req.user.role, 'CONFERENCE_ONLY', bookingPhase);
    const workshopConference = calculatePrice(req.user.role, 'WORKSHOP_CONFERENCE', bookingPhase);
    const combo = calculatePrice(req.user.role, 'COMBO', bookingPhase);

    res.json({
      bookingPhase,
      pricing: {
        CONFERENCE_ONLY: conferenceOnly,
        WORKSHOP_CONFERENCE: workshopConference,
        COMBO: combo
      }
    });
  } catch (error) {
    console.error('Pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;