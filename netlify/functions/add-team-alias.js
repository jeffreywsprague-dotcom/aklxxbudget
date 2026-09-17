const { getLeagueStore } = require('./lib/blobStore');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  try {
    const params = event.queryStringParameters || {};
    if (!params.key || params.key !== process.env.BOOKMARKLET_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const teamName = params.teamName;
    const owner = params.owner;
    if (!teamName || !owner) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: 'Need both ?teamName= and &owner= in the URL.' }),
      };
    }

    const store = getLeagueStore();
    const data = await store.get('current', { type: 'json' });
    if (!data) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No league data found.' }) };
    }
    if (!data.owners.includes(owner)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: `"${owner}" isn't one of the known owners: ${data.owners.join(', ')}` }),
      };
    }

    data.teamMap[teamName] = owner;
    await store.setJSON('current', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: `"${teamName}" now maps to ${owner}.`, teamMap: data.teamMap }, null, 2),
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
