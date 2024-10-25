const express = require('express');
const router = express.Router();
const {extractDetails,provideanalytics, clientsummary, summary_chatbot} = require('../controller/geminiController');

router.post('/voice2crm', extractDetails);
router.get('/analytics', provideanalytics);
router.get('/summary', clientsummary);
router.get('/question', summary_chatbot);


module.exports = router;
