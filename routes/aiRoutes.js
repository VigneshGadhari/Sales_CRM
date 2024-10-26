const express = require('express');
const router = express.Router();
const {extractDetails,provideanalytics, clientsummary, summary_chatbot,provideCompanyAnalytics} = require('../controller/geminiController');

router.post('/voice2crm', extractDetails);
router.get('/analytics', provideanalytics);
router.get('/summary', clientsummary);
router.get('/question', summary_chatbot);
router.get('/companysummary', provideCompanyAnalytics);


module.exports = router;
