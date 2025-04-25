const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env
const { HUBSPOT_API_URL, HUBSPOT_ACCESS_TOKEN } = require('../config/hubspot');

const DEFAULT_PROPERTIES = [
  'name',
  'website',
  'phone',
  'email',
  'city',
  'address',
  'numberofemployees',
  'linkedin_company_page',
  'industry',
  'socio_economic_segment',
  'description',
  'priority_level',
];

// CREATE a new company
const createCompany = async (req, res) => {
  try {
    const companyData = {
      properties: {
        name: req.body.company_name,
        website: req.body.website,
        phone: req.body.phone,
        email: req.body.email,
        city: req.body.city,
        address: req.body.address,
        numberofemployees: req.body.number_of_employees,
        linkedin_company_page: req.body.linkedin_company_page,
        industry: req.body.industry,
        socio_economic_segment: req.body.socio_economic_segment,
        description: req.body.description,
        priority_level: req.body.priority_level,
      },
    };

    const response = await axios.post(
      `${HUBSPOT_API_URL}/companies`,
      companyData,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Company created: ', response.data);
    res.status(201).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(err.response?.status || 500).json({ message: err.message });
  }
};

// READ all companies
const getAllCompanies = async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_URL}/companies`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        },
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// READ a specific company by ID
const getCompanyById = async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_URL}/companies/${req.body.id}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        },
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// UPDATE a company by ID
const updateCompany = async (req, res) => {
  const properties = {
    name: req.body.company_name,
    website: req.body.website,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    address: req.body.address,
    number_of_employees: req.body.number_of_employees,
    linkedin_company_page: req.body.linkedin_company_page,
    industry: req.body.industry,
    socio_economic_segment: req.body.socio_economic_segment,
    description: req.body.description,
    priority_level: req.body.priority_level,
  };

  const SimplePublicObjectInputForUpdate = {
    properties,
  };

  console.log(SimplePublicObjectInputForUpdate);

  try {
    const response = await axios.patch(
      `${HUBSPOT_API_URL}/companies/${req.params.id}`,
      SimplePublicObjectInputForUpdate,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ message: e.message });
  }
};

// DELETE a company by ID
const deleteCompany = async (req, res) => {
  try {
    await axios.delete(
      `${HUBSPOT_API_URL}/companies/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(204).send();
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// SEARCH for companies
const searchCompanies = async (req, res) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_URL}/companies/search`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        },
      }
    );
    res.status(200).json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
};
