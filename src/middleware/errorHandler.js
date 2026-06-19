const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
