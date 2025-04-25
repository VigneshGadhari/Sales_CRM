const express = require('express');
const router = express.Router();
const companyController = require('../controller/companyController');

router.post('/', companyController.createCompany);
router.get('/', companyController.getAllCompanies);
router.get('/getbyid', companyController.getCompanyById);
router.patch('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);
router.post('/search', companyController.searchCompanies);

module.exports = router;
