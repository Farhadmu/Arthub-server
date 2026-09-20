const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Artwork = require('../models/Artwork');
const { auth } = require('../middleware/auth');
const { createCertificate } = require('../services/certificateGenerator');

// Public verification endpoint (anyone scanning QR code can verify provenance)
router.get('/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const certificate = await Certificate.findOne({ verificationHash: hash })
      .populate('artwork', 'title image price category style mood')
      .populate('artist', 'name avatar')
      .populate('buyer', 'name');

    if (!certificate) {
      return res.status(404).json({
        verified: false,
        message: 'No digital Certificate of Authenticity found matching this cryptographic hash.',
      });
    }

    res.json({
      verified: certificate.status === 'VALID',
      certificate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Verification lookup failed' });
  }
});

// Get user's certificates (Authenticated)
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await Certificate.find({ buyer: req.user._id })
      .populate('artwork', 'title image price category style')
      .populate('artist', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch certificates' });
  }
});

// Get certificate for a specific artwork
router.get('/artwork/:artworkId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      artwork: req.params.artworkId,
      status: 'VALID',
    })
      .populate('artwork', 'title image price category')
      .populate('artist', 'name avatar')
      .populate('buyer', 'name');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not yet issued for this piece' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch certificate' });
  }
});

// Issue certificate (e.g. upon successful purchase or manual artist minting)
router.post('/issue', auth, async (req, res) => {
  try {
    const { artworkId } = req.body;
    const artwork = await Artwork.findById(artworkId);

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if certificate already exists
    let existing = await Certificate.findOne({ artwork: artworkId, buyer: req.user._id });
    if (existing) {
      return res.json({ message: 'Certificate already issued', certificate: existing });
    }

    const certificate = await createCertificate({
      artwork,
      buyer: req.user,
    });

    res.status(201).json({
      message: 'Certificate of Authenticity successfully registered',
      certificate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Certificate generation failed' });
  }
});

module.exports = router;
