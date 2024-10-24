require('dotenv').config();

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

module.exports = {
  HUBSPOT_API_URL: 'https://api.hubapi.com/crm/v3/objects',
  HUBSPOT_ACCESS_TOKEN ,
};
