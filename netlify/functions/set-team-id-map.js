const { getLeagueStore } = require('./lib/blobStore');

// Permanent Yahoo team IDs (from /f1/73833/N) — these never change even when
// a manager renames their team's display name.
const TEAM_ID_MAP = {
  '1': 'Jeff',
  '2': 'Tony',
  '3': 'Marc',
  '4': 'Adam',
  '5': 'Dan',
  '6': 'Ken',
  '7': 'Randy',
  '8': 'Brad',
  '9': 'Ryan',
  '10': 'Leeman',
  '11': 'Matt',
  '12': 'CMAC',
};

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

    const store = getLeagueStore();
    const data = await store.get('current', { type: 'json' });
    if (!data) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No league data found.' }) };
    }

    data.teamIdMap = TEAM_ID_MAP;
    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, teamIdMap: data.teamIdMap }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
