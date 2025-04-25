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
router.get('/getbyid', getContactById); 
router.patch('/:id', updateContact); 
router.delete('/deletebyid', deleteContact); 
router.post('/search', searchContacts); 

module.exports = router;
