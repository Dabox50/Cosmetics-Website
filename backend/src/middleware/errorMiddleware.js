const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Ensure CORS headers are present even on errors
  const origin = req.get('origin');
  const allowedOrigins = [
    'https://www.shayorscosmestics.com', 
    'https://shayorscosmestics.com', 
    'https://www.shayorscosmetics.com', 
    'https://shayorscosmetics.com', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
