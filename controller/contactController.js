// controllers/contactController.js
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env

const HUBSPOT_ACCESS_TOKEN = "pat-na1-73918d52-fbff-4181-be7b-f7e05270fd95";

const DEFAULT_PROPERTIES = [
  'firstname',
  'lastname',
  'phone',
  'email',
  'website',
  'notes',
  'city',
  'socio_economic_segment',
  'cultural_affinity',
  'language',
  'next_activity_date',
  'priority_level',
];

// CREATE a new contact
const createContact = async (req, res) => {
  try {
    const contactData = {
      properties: {
        firstname: req.body.first_name,
        lastname: req.body.last_name,
        phone: req.body.phone_number,
        email: req.body.email,
        website: req.body.website,
        notes: req.body.notes,
        city: req.body.city,
        socio_economic_segment: req.body.socio_economic_segment,
        cultural_affinity: req.body.cultural_affinity,
        language: req.body.language,
        next_activity_date: req.body.next_activity_date,
        priority_level: req.body.priority_level,
      }
    };

    const response = await axios.post(
      "https://api.hubspot.com/crm/v3/objects/contacts",
      contactData,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        }
      }
    );

    console.log("Contact created: ", response.data);
    res.status(201).json(response.data);
  } catch (err) {
    console.log(err);
    res.status(err.response?.status || 500).json({ message: err.message });
  }
};

// READ all contacts
const getAllContacts = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.hubspot.com/crm/v3/objects/contacts",
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        }
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// READ a specific contact by ID
const getContactById = async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.hubspot.com/crm/v3/objects/contacts/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        }
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// UPDATE a contact by ID
const updateContact = async (req, res) => {
  const properties = {
    firstname: req.body.first_name,
    lastname: req.body.last_name,
    phone: req.body.phone_number,
    email: req.body.email,
    website: req.body.website,
    notes: req.body.notes,
    city: req.body.city,
    socio_economic_segment: req.body.socio_economic_segment,
    cultural_affinity: req.body.cultural_affinity,
    language: req.body.language,
    next_activity_date: req.body.next_activity_date,
    priority_level: req.body.priority_level,
  };

  const SimplePublicObjectInputForUpdate = {
    properties,
  };

  console.log(SimplePublicObjectInputForUpdate);

  try {
    const response = await axios.patch(
      `https://api.hubspot.com/crm/v3/objects/contacts/${req.params.id}`,
      SimplePublicObjectInputForUpdate,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        }
      }
    );
    res.json(response.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ message: e.message });
  }
};

// DELETE a contact by ID
const deleteContact = async (req, res) => {
  try {
    await axios.delete(
      `https://api.hubspot.com/crm/v3/objects/contacts/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        }
      }
    );
    res.status(204).send();
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

// SEARCH for contacts
const searchContacts = async (req, res) => {
  try {
    const response = await axios.post(
      `https://api.hubspot.com/crm/v3/objects/contacts/search`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': "application/json"
        },
        params: {
          properties: DEFAULT_PROPERTIES.join(','),
        }
      }
    );
    res.status(200).json(response.data);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

module.exports = {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  searchContacts,
};


// const createContact = async (req, res) => {
//   try {
//       const accessToken = "pat-na1-73918d52-fbff-4181-be7b-f7e05270fd95";
//       const contactData = {
//           properties: {
//             firstname: req.body.first_name,
//             lastname: req.body.last_name,
//             phone: req.body.phone_number,
//             email: req.body.email,
//             website: req.body.website,
//             notes: req.body.notes,
//             city: req.body.city,
//             socio_economic_segment: req.body.socio_economic_segment,
//             cultural_affinity: req.body.cultural_affinity,
//             language: req.body.language,
//             next_activity_date: req.body.notes_next_activity_date,
//             priority_level: req.body.priority_level,
//           }
//       };

//       const response = await axios.post(
//           "https://api.hubspot.com/crm/v3/objects/contacts",
//           contactData,
//           {
//               headers: {
//                   Authorization: `Bearer ${accessToken}`,
//                   'Content-Type': "application/json"
//               }
//           }
//       );
//       console.log("Contact created: ", response.data);
//       res.json(response.data);
//   } catch (err) {
//       console.log(err);
//       throw err;
//   }
// }
