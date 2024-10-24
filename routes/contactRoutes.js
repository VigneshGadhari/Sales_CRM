// routes/contactRoutes.js
const express = require('express');
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  searchContacts,
} = require('../controller/contactController');

const router = express.Router();

router.post('/create', createContact); 
router.get('/', getAllContacts); 
router.get('/:id', getContactById); 
router.patch('/:id', updateContact); 
router.delete('/:id', deleteContact); 
router.post('/search', searchContacts); 

module.exports = router;
