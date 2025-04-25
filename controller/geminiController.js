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

// Add this helper function at the top after the imports
const cleanGeminiResponse = (response) => {
    return response
        .replace(/```json\n/g, '')  // Remove opening JSON code block
        .replace(/```\n/g, '')      // Remove closing code block
        .replace(/```/g, '')        // Remove any remaining code block markers
        .trim();                    // Remove extra whitespace
};

// Controller function for extracting user or company details
const extractDetails = async (req, res) => {
  try {
    const { userInput } = req.body;
    const isCompany = identifyInputType(userInput);
    const prompt = generatePrompt(userInput, isCompany === 'company');

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    
    let responseData;
    try {
      responseData = cleanGeminiResponse(response.response.text());
      responseData = JSON.parse(responseData);
    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);
      return res.status(500).json({ 
        error: "Failed to parse response as JSON",
        details: response.response.text()
      });
    }

    res.json(responseData);
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

    IMPORTANT: Return the response as plain text without any markdown formatting or code blocks.

    Client info: ${input}`;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    response.response.text = () => cleanGeminiResponse(response.response.text());
    return response;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

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

const question = async(req,res) => {
  try{
    const input = req.body.query;
    const question = req.body.question;
    const prompt = `
      You are an expert financial guide, specializing in clearing any doubts, providing guidance about how to approach, when to approach anything that is useful for a person working in sales.
      
      IMPORTANT: Return the response as plain text without any markdown formatting or code blocks.
      
      Answer the below question based on the given information: ${input}
      Question: ${question}
    `;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const response = await chatSession.sendMessage(prompt);
    const cleanedResponse = cleanGeminiResponse(response.response.text());
    res.status(200).json({ response: cleanedResponse });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

const bestFollowUp = async (req, res) => {
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
        const culturalContext = details.cultural_affinity || 'Indian';
        const region = details.city || 'Unknown';
        
        const prompt = `Act as an expert in Indian business culture and regional diversity. Generate a detailed follow-up strategy for this sales lead.

        Lead Details:
        - Name: ${details.firstname} ${details.lastname}
        - Cultural Background: ${culturalContext}
        - Region/City: ${region}
        - Language: ${details.language || 'Not specified'}
        - Industry: ${details.industry || 'Not specified'}
        - Socio-Economic Segment: ${details.socio_economic_segment || 'Not specified'}

        Consider the following aspects and provide recommendations:
        1. Cultural sensitivities specific to their background
        2. Regional customs and business etiquette
        3. Language and communication preferences
        4. Festival opportunities for follow-up
        5. Industry-specific approach
        6. Preferred communication channels
        7. Best timing based on regional factors
        8. Personalized conversation starters

        IMPORTANT: 
        1. Return ONLY raw JSON without any markdown formatting or code blocks.
        2. Do not use bullet points or lists in any of the text responses.
        3. Format all text responses as paragraphs with proper sentences.
        4. Use commas or semicolons to separate items that would normally be in a list.

        Use this exact structure:
        {
            "personalizedStrategy": {
                "culturalConsiderations": "string with cultural insights",
                "communicationApproach": "string with communication strategy",
                "timingRecommendations": "string with timing advice",
                "businessEtiquette": "string with etiquette guidelines",
                "conversationStarters": "string with conversation starters in paragraph form",
                "festivalOpportunities": "string with festivals in paragraph form",
                "doAndDonts": {
                    "do": "string with all dos in paragraph form",
                    "dont": "string with all donts in paragraph form"
                }
            }
        }`;

        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });
        
        const result = await chatSession.sendMessage(prompt);
        const aiResponse = result.response.text();
        
        try {
            const cleanResponse = cleanGeminiResponse(aiResponse);
            const parsedResponse = JSON.parse(cleanResponse);
            
            const followUpStrategy = {
                contactDetails: {
                    name: `${details.firstname} ${details.lastname}`,
                    culturalAffinity: details.cultural_affinity,
                    region: details.city,
                    industry: details.industry,
                    language: details.language,
                    socioEconomicSegment: details.socio_economic_segment
                },
                aiInsights: parsedResponse
            };
            console.log(followUpStrategy);
            res.json(followUpStrategy);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('AI Response:', aiResponse);
            res.status(500).json({ 
                error: "Failed to parse AI response",
                details: aiResponse
            });
        }
    } catch (error) {
        console.error('Request Error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
};

const regionalTips = async (req, res) => {
  console.log("Route hit with id = "+req.body.id);
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
        const region = details.city || 'Unknown';
        
        const prompt = `Act as an expert in Indian regional business practices. Generate comprehensive sales and relationship building tips for this specific lead.

        Lead Details:
        - Name: ${details.firstname} ${details.lastname}
        - Region/City: ${region}
        - Cultural Background: ${details.cultural_affinity || 'Not specified'}
        - Industry: ${details.industry || 'Not specified'}
        - Language: ${details.language || 'Not specified'}
        - Socio-Economic Segment: ${details.socio_economic_segment || 'Not specified'}

        Provide detailed regional insights considering:
        1. Regional business culture specific to ${region}
        2. Local festivals and important dates
        3. Key language considerations and respectful phrases
        4. Local customs that impact business
        5. Regional meeting preferences
        6. Local dietary considerations
        7. Regional gifting customs
        8. Market dynamics in ${region}
        9. Industry trends in this region
        10. Cultural nuances specific to this area

        IMPORTANT: 
        1. Return ONLY raw JSON without any markdown formatting or code blocks.
        2. Do not use bullet points or lists in any of the text responses.
        3. Format all text responses as paragraphs with proper sentences.
        4. Use commas or semicolons to separate items that would normally be in a list.

        Use this exact structure:
        {
            "regionalInsights": {
                "businessCulture": "string describing regional business culture",
                "localCustoms": "string describing important customs",
                "languageTips": "string with all language tips in paragraph form",
                "festivalCalendar": "string with all festivals in paragraph form",
                "businessProtocols": "string describing protocols",
                "marketDynamics": "string describing market insights",
                "industryTrends": "string describing trends",
                "culturalNuances": {
                    "keyConsiderations": "string with all considerations in paragraph form",
                    "traditions": "string with all traditions in paragraph form",
                    "etiquette": "string with all etiquette points in paragraph form"
                }
            }
        }`;

        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });
        
        const result = await chatSession.sendMessage(prompt);
        const aiResponse = result.response.text();
        
        try {
            const cleanResponse = cleanGeminiResponse(aiResponse);
            const parsedResponse = JSON.parse(cleanResponse);
            
            const regionalStrategy = {
                contactDetails: {
                    name: `${details.firstname} ${details.lastname}`,
                    region: details.city,
                    culturalAffinity: details.cultural_affinity,
                    industry: details.industry,
                    language: details.language,
                    socioEconomicSegment: details.socio_economic_segment
                },
                aiInsights: parsedResponse
            };
            console.log(regionalStrategy);
            res.json(regionalStrategy);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('AI Response:', aiResponse);
            res.status(500).json({ 
                error: "Failed to parse AI response",
                details: aiResponse
            });
        }
    } catch (error) {
        console.error('Request Error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
};

module.exports = { extractDetails, provideanalytics,clientsummary, question, provideCompanyAnalytics, bestFollowUp, regionalTips};
