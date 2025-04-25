const axios = require('axios');
const { HUBSPOT_API_URL, HUBSPOT_ACCESS_TOKEN } = require('../config/hubspot');
const DEFAULT_PROPERTIES = [
  'firstname',
  'lastname',
  'age_group',
  'gender',
  'phone',
  'email',
  'company',
  'website',
  'hs_content_membership_notes',
  'city',
  'industry',
  'socio_economic_segment',
  'cultural_affinity',
  'language',
  'next_activity_date',
  'priority_level',
];

const calculateNextActivityDate = (priorityLevel) => {
  const currentDate = new Date();
  let nextActivityDate;
  
  // Function to generate a random number of days between a minimum and maximum
  const getRandomDays = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // Regular expressions for priority levels
  const highPriorityRegex = /high\s*priority/i;
  const mediumPriorityRegex = /medium\s*priority/i;
  const lowPriorityRegex = /low\s*priority/i;
  const followUpRequiredRegex = /follow-up\s*required/i;
  const inactiveRegex = /inactive/i;
  const hotLeadRegex = /hot\s*lead/i;
  
  if (highPriorityRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
  } else if (mediumPriorityRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  } else if (lowPriorityRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
  } else if (followUpRequiredRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days
  } else if (inactiveRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
  } else if (hotLeadRegex.test(priorityLevel)) {
    nextActivityDate = new Date(currentDate.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day
  } else {
    // Default: Add random number of days between 1 and 10
    const randomDays = getRandomDays(1, 10);
    nextActivityDate = new Date(currentDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
  }
  
  return Math.floor(nextActivityDate.getTime() / 1000);
   // Convert to epoch time (seconds)
};

// CREATE a new contact
const createContact = async (req, res) => {
  try {
    const priorityLevel = req.body.priority_level;
    const contactData = {
      properties: {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        age_group: req.body.age_group,
        gender: req.body.gender,
        phone: req.body.phone_number,
        email: req.body.email,
        company: req.body.company,
        website: req.body.website,
        hs_content_membership_notes: req.body.hs_content_membership_notes,
        city: req.body.city,
        industry: req.body.industry,
        socio_economic_segment: req.body.socio_economic_segment,
        cultural_affinity: req.body.cultural_affinity,
        language: req.body.language,
        next_activity_date: "",
        priority_level: priorityLevel,
      },
    };
    const response = await axios.post(
      `${HUBSPOT_API_URL}/contacts`,
      contactData,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    response.data.properties.next_activity_date = calculateNextActivityDate(priorityLevel);
    console.log('Contact created: ', response.data);
    res.status(201).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ message: err.message });
  }
};


// READ all contacts
const getAllContacts = async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_URL}/contacts`,
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

// READ a specific contact by ID
const getContactById = async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_URL}/contacts/${req.body.id}`,
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

// UPDATE a contact by ID
const updateContact = async (req, res) => {
  const properties = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    age_group: req.body.age_group,
    gender: req.body.gender,
    phone: req.body.phone_number,
    email: req.body.email,
    company: req.body.company,
    website: req.body.website,
    hs_content_membership_notes: req.body.hs_content_membership_notes,
    city: req.body.city,
    industry: req.body.industry,
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
      `${HUBSPOT_API_URL}/contacts/${req.params.id}`,
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

// DELETE a contact by ID
const deleteContact = async (req, res) => {
  try {
    await axios.delete(
      `${HUBSPOT_API_URL}/contacts/${req.body.id}`,
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

// SEARCH for contacts
const searchContacts = async (req, res) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_URL}/contacts/search`,
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
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  searchContacts,
};
