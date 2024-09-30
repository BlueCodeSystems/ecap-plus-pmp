const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Set up a proxy for your Directus API
app.use('/api', createProxyMiddleware({
  target: 'https://api.achieve.bluecodeltd.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',  // Remove the '/api' prefix when forwarding the request
  },
}));

// Serve the Vite app (replace 'dist' with your actual build output folder)
app.use(express.static('dist'));

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
