// controllers/extractionController.js
const { model, generationConfig } = require('../config/gemini');
const axios = require('axios');
const { HUBSPOT_API_URL, HUBSPOT_ACCESS_TOKEN } = require('../config/hubspot');

const contact_properties = [
    'age_group',
    'city',
    'industry',
    'socio_economic_segment',
    'cultural_affinity',
  ];

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
// Function to determine if the input is for a company or a contact
const identifyInputType = (input) => {
    const keywords = ["company", "contact"];
    const inputLower = input.toLowerCase();
  
    // Initialize a variable to store the first occurrence type
    let firstOccurrence = null;

    for (const keyword of keywords) {
        const index = inputLower.indexOf(keyword);
        // Check if the keyword exists in the input
        if (index !== -1) {
            // If this is the first occurrence or appears earlier than the previous one, update firstOccurrence
            if (firstOccurrence === null || index < inputLower.indexOf(firstOccurrence)) {
                firstOccurrence = keyword;
            }
        }
    }
  
    // Return the identified type based on the first occurrence found
    return firstOccurrence || 'contact'; // Default to 'contact' if no keywords are found
};
// Function to generate a prompt for extracting fields
const generatePrompt = (input, isCompany) => {
  if (isCompany) {
    return `Extract the following user details from the text:
    'contactorcompany:"Company'
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
    'hs_content_membership_notes',
    'priority_level',
    Input: ${input}

    Return the values in JSON format, donot return anything else, just the keys, and values. If something is missing except contactorcompany, return null.
    Example:
    {
    "contactorcompany": "Company",
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
    'hs_content_membership_notes',
    'priority_level',
    }`;
  } else {
    return `Extract the following user details from the text:
    'contactorcompany':"Contact"
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
    Input: ${input}

    Return the values in JSON format, donot return anything else, just the keys, and values. If something is missing except contactorcompany, return null.
    Example:
    {
    "contactorcompany": "Contact",
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
    }
`;
  }
};

// Controller function for extracting user or company details
const extractDetails = async (req, res) => {
  try {
    const { userInput } = req.body; // Expecting JSON input

    // Automatically identify if the input is for a company or contact
    const isCompany = identifyInputType(userInput);
    const prompt = generatePrompt(userInput, isCompany === 'company');

    // Create chat session with the prompt
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    
    let responseData;
    try {
      responseData = response.response.text().replace('json','');
      responseData = responseData.replaceAll('```','');
      responseData = JSON.parse(responseData.replaceAll('\n',''));
    } catch (jsonError) {
        console.log(responseData)
      return res.status(500).json({ error: "Failed to parse response as JSON." });
    }

    res.json(responseData); // Send the response back to the user in JSON format
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};


const ai_summarize = async(input) =>{
  try{
    console.log(input)
    const prompt = `Act as an Indian sales advisor specializing in providing sales summary for their clients, specializing in giving advice tailored to indians, their languague, culture, festivals, language. 

    Generate a summary of a client based on the given information, generate a summary for a client, include their  include all the information you are given which is not null for the below advice,  you may include their Main skill or expertise, professional background,their goals, their engagement style: which will include their preferences, language and anything include in hs_content_membership_notes, also talk about tailored advice related to their city, cultural affinity, socio_economic_segment, industry. Also talk about their challenges that they might face based on the key factors, their value proposition, suggestiosns based on their field. and if there exists a field called next_activity_date with any value other thane null. Make it structured and simplified.
    Client info, donot provide any information that is provided below as is, give a suggestion based on a field if mentioned:${input}
    `;

    // Create chat session with the prompt
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    return response;
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
}

function generateRecentInteraction(details, nextActivityDate) {
  // Get the creation date from details, default to the current date if null
  const createdAt = details.createdAt ? new Date(details.createdAt) : new Date();

  // Get the next activity date if available, otherwise null
  const nextActivity = nextActivityDate ? new Date(nextActivityDate * 1000) : null;

  // If nextActivityDate is null or undefined, use createdAt as fallback
  const recentInteraction = nextActivity && nextActivity > createdAt ? nextActivity : createdAt;

  return Math.floor(recentInteraction.getTime() / 1000); // Return epoch time
}


const clientsummary = async (req, res) => {
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

    const details = response.data.properties;
    const summary = await ai_summarize(JSON.stringify(details, null, 2));
    const priority_tag = details.priority_level || "Not specified";

    const recent_interaction = generateRecentInteraction(details.createdate, details.next_activity_date);

    // Merging all into one JSON
    const clientSummary = {
      firstname: details.firstname,
      lastname: details.lastname,
      age_group: details.age_group,
      city: details.city,
      company: details.company,
      createdate: details.createdate,
      lastmodifieddate: details.lastmodifieddate,
      cultural_affinity: details.cultural_affinity,
      email: details.email,
      phone: details.phone,
      gender: details.gender,
      hs_object_id: details.hs_object_id,
      industry: details.industry,
      language: details.language,
      next_activity_date: details.next_activity_date,
      socio_economic_segment: details.socio_economic_segment,
      website: details.website,
      summary: summary.response.candidates[0].content.parts[0].text,
      priority_tag: priority_tag, // Priority Level
      recent_interaction: recent_interaction // Generated recent interaction based on logic
    };

    res.status(200).json(clientSummary);
    
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};


const calculateAnalytics = (contacts) => {
  // Initialize counters for each field
  const analytics = {
    age_group: {},
    gender: {},
    company: {},
    city: {},
    industry: {},
    socio_economic_segment: {},
    cultural_affinity: {},
    language: {},
    priority_level: {}
  };

  // Total number of contacts
  const totalContacts = contacts.results.length;

  // If there are no contacts, return empty analytics
  if (totalContacts === 0) {
    return analytics;
  }

  // Iterate over each contact to count occurrences of each value
  contacts.results.forEach(contact => {
    // For each property, increment the corresponding count
    for (const [key, value] of Object.entries(contact.properties)) {
      if (analytics[key] && value) { // Check if the key exists in analytics and value is not null
        analytics[key][value] = (analytics[key][value] || 0) + 1;
      }
    }
  });

  // Calculate total occurrences for each category
  const totalOccurrences = {};
  for (const key in analytics) {
    totalOccurrences[key] = Object.values(analytics[key]).reduce((acc, count) => acc + count, 0);
  }

  // Calculate percentages
  for (const key in analytics) {
    for (const value in analytics[key]) {
      // Convert count to percentage based on total occurrences of that key type
      analytics[key][value] = ((analytics[key][value] / totalOccurrences[key]) * 100).toFixed(2) + '%';
    }
  }

  return analytics;
};


const provideanalytics = async (req, res) => {
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
    const analyticsResult = calculateAnalytics(response.data);
    res.status(200).json(analyticsResult);
  } catch (e) {
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

const calculateCompanyAnalytics = (contacts) => {
  // Initialize counters for each company property
  const analytics = {
    name: {},
    website: {},
    phone: {},
    email: {},
    city: {},
    address: {},
    numberofemployees: {},
    linkedin_company_page: {},
    industry: {},
    socio_economic_segment: {},
    description: {},
    priority_level: {}
  };

  // Total number of companies
  const totalContacts = contacts.results.length;

  // If there are no contacts, return empty analytics
  if (totalContacts === 0) {
    return analytics;
  }

  // Iterate over each contact to count occurrences of each value
  contacts.results.forEach(contact => {
    // For each property, increment the corresponding count
    for (const [key, value] of Object.entries(contact.properties)) {
      if (analytics[key] && value) { // Check if the key exists in analytics and value is not null
        analytics[key][value] = (analytics[key][value] || 0) + 1;
      }
    }
  });

  // Calculate total occurrences for each category
  const totalOccurrences = {};
  for (const key in analytics) {
    totalOccurrences[key] = Object.values(analytics[key]).reduce((acc, count) => acc + count, 0);
  }

  // Calculate percentages
  for (const key in analytics) {
    for (const value in analytics[key]) {
      // Convert count to percentage based on total occurrences of that key type
      analytics[key][value] = ((analytics[key][value] / totalOccurrences[key]) * 100).toFixed(2) + '%';
    }
  }

  return analytics;
};


const provideCompanyAnalytics = async (req, res) => {
  try {
    // Fetch companies data
    const companiesResponse = await axios.get(`${HUBSPOT_API_URL}/companies`, {
      headers: {
        Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      params: {
        properties: [
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
          'priority_level'
        ].join(','),
      },
    });

    // Calculate company analytics
    const companyAnalytics = calculateCompanyAnalytics(companiesResponse.data);

    // Return the result
    res.status(200).json(companyAnalytics);
  } catch (e) {
    // Handle errors
    res.status(e.response?.status || 400).json({ message: e.message });
  }
};

const summary_chatbot = async(req,res) => {
  try{
    const input = req.body.query;
    const question = req.body.question;
    const prompt = `
      You are an expert financial guide, specializing in clearing any doubts, providing guidance about how to approach, when to approach anything that is useful for a person working in sales,
      Answer the below question based on the given information: ${input}
      Question: ${question}
    `;

    // Create chat session with the prompt
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    res.status(200).json(response.response.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { extractDetails, provideanalytics,clientsummary, summary_chatbot, provideCompanyAnalytics};
