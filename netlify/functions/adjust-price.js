const { getLeagueStore } = require('./lib/blobStore');

const ADJUSTMENTS = [
  { owner: 'Dan', name: 'Brian Robinson (Atl - RB)', newCost: 3 },
];

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

    const results = [];
    for (const a of ADJUSTMENTS) {
      const roster = data.rosters[a.owner];
      if (!roster) {
        results.push({ ...a, status: 'owner not found' });
        continue;
      }
      const idx = roster.findIndex((p) => p.name === a.name);
      if (idx === -1) {
        results.push({ ...a, status: 'not found on roster' });
        continue;
      }
      const oldCost = roster[idx].cost;
      roster[idx].cost = a.newCost;
      results.push({ ...a, status: 'updated', oldCost });
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
