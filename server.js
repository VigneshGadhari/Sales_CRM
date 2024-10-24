const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes'); // Adjust the path as necessary

const app = express();
const PORT = 4000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json()); // Middleware to parse JSON body

// Use your contact routes
app.use('/contacts', contactRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
