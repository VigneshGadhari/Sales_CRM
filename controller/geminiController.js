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
    const prompt = `
      When generating a client summary for the summary page, focus on encapsulating key aspects that provide insights into how and when to approachthe client, make kind of a short pitchdeck. DONOT PROVIDE ANY INFORMATION THAT YOU DON'T HAVE. Consider the following elements to create a comprehensive and informative summary, donot mention that this is a summary anywhere just provide the summary:

      Elements to Include in the Summary:
      Key Attributes:

      Main Skills or Expertise: Identify and highlight the primary skills or areas of expertise that the client brings to their professional role. This could include technical skills, industry-specific knowledge, or unique capabilities.
      Professional Background: Provide a brief overview of the client’s professional journey. Include notable achievements, past roles, and experiences that are relevant to their current position and responsibilities.
      Client Goals:

      Objectives or Aspirations: Summarize any specific goals or aspirations mentioned in the client's hs_content_membership_notes. This may include career ambitions, project objectives, or areas of interest that the client is passionate about pursuing.
      Engagement Style:

      Preferred Communication Style: Note any preferences the client has regarding communication or engagement. Indicate whether they prefer formal or informal interactions, and how they like to receive information.
      Interests and Hobbies:

      Relevant Interests: Highlight any personal interests or hobbies that might influence the client's business decisions or relationship-building. This can help tailor future interactions and discussions.
      Challenges or Pain Points:

      Key Challenges: Provide a summary of the challenges or pain points the client is currently facing. Understanding these can inform strategies for engagement and support.
      Value Proposition:

      What They Value: Identify what the client values in a partnership or collaboration. This could encompass attributes like innovation, reliability, quality, or responsiveness.
      Suggestions Based on Other Fields:
      While the summary should not explicitly display other fields, you can provide insightful suggestions based on them:

      Company Insights: Consider providing insights related to the company associated with the client. For example, "Explore partnership opportunities with [Company]."
      Industry Context: Offer recommendations tied to the client’s industry, such as, "Given your interest in [Industry], consider discussing [trending topic]."
      Demographics: Tailor suggestions based on the client’s socio-economic segment or age group, such as, "As a middle-aged professional, you might find value in networking events tailored for your demographic."
      Cultural Affinity: Suggest culturally relevant approaches or content that resonate with the client’s cultural background.
      Language Preferences: If applicable, offer communication options or materials in the client’s preferred language(s).
      Next Steps:
      Include actionable next steps based on the next_activity_date, such as, "Follow up regarding our last discussion on [date]."

      Summary Example:
      Here’s a structured example of how to format the summary using the elements mentioned above, if you donot have necessary information, you can proceed with removing that specific section:

      Client Summary for [First Name] [Last Name]:

      [First Name] is a skilled professional with expertise in [skills/areas of expertise]. With a background in [professional background], they are focused on [goals/aspirations]. They prefer [communication style] interactions and value [what they value in partnerships].

      Currently, [First Name] is facing challenges related to [key challenges]. To enhance engagement, consider discussing [suggestions based on industry or company], and remember to follow up regarding our last conversation on [next_activity_date].

      This structured summary provides a holistic view of the client while also facilitating strategic approaches to foster and enhance the client relationship based on additional relevant details.
      Find the client details here: ${input}
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
    const summary = await ai_summarize(details.hs_content_membership_notes);
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

module.exports = { extractDetails, provideanalytics,clientsummary, summary_chatbot};
