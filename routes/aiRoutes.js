const express = require('express');
const router = express.Router();
const {extractDetails, provideanalytics, clientsummary, question, provideCompanyAnalytics, bestFollowUp, regionalTips} = require('../controller/geminiController');

router.post('/voice2crm', extractDetails);
router.post('/analytics', provideanalytics);
router.post('/regional-tips', regionalTips);
router.post('/best-followup', bestFollowUp);
router.post('/summary', clientsummary);
router.post('/question', question);
router.post('/company-analytics', provideCompanyAnalytics);

module.exports = router;
