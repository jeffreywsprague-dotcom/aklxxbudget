const { getStore } = require('@netlify/blobs');

function getLeagueStore() {
  return getStore({
    name: 'akl-league',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_API_TOKEN,
  });
}

module.exports = { getLeagueStore };
