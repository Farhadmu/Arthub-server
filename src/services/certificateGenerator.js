const crypto = require('crypto');
const Certificate = require('../models/Certificate');

/**
 * Generates a cryptographically verifiable Digital Certificate of Authenticity (COA)
 */
function generateVerificationHash(artworkId, buyerId, timestamp) {
  const secret = process.env.JWT_SECRET || 'arthub_coa_salt_2026';
  const payload = `${artworkId}:${buyerId}:${timestamp}:${secret}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function createCertificate({ artwork, buyer, transaction }) {
  const timestamp = Date.now();
  const verificationHash = generateVerificationHash(artwork._id, buyer._id, timestamp);

  const qrVerificationUrl = `${process.env.CLIENT_URL || 'https://arthub-client.vercel.app'}/verify/${verificationHash}`;

  const certificate = new Certificate({
    artwork: artwork._id,
    artworkTitle: artwork.title,
    artist: artwork.artist,
    artistName: artwork.artistName,
    buyer: buyer._id,
    buyerName: buyer.name,
    transaction: transaction ? transaction._id : null,
    editionNumber: '1/1 Original Master',
    medium: artwork.category || 'Digital Fine Art',
    dimensions: 'Variable / 300 DPI Museum Resolution',
    verificationHash,
    qrCodeUrl: qrVerificationUrl,
    metadata: {
      colorPalette: artwork.colorPalette || [],
      style: artwork.style || 'Contemporary',
      yearCreated: new Date(artwork.createdAt || Date.now()).getFullYear(),
      provenanceTrail: [
        {
          event: 'Minted & Catalogued on ArtHub',
          party: artwork.artistName,
          timestamp: artwork.createdAt || new Date(),
        },
        {
          event: 'Primary Acquisition & Provenance Seal Registered',
          party: buyer.name,
          timestamp: new Date(),
        },
      ],
    },
  });

  await certificate.save();
  return certificate;
}

module.exports = {
  generateVerificationHash,
  createCertificate,
};
