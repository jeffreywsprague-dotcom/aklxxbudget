const { getLeagueStore } = require('./lib/blobStore');

const ADDITIONS = [
  { owner: 'Ryan', name: 'Patriots (NE - DEF)', cost: 1 },
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
    for (const a of ADDITIONS) {
      if (!data.rosters[a.owner]) {
        results.push({ ...a, status: 'owner not found' });
        continue;
      }
      const already = data.rosters[a.owner].some((p) => p.name === a.name);
      if (already) {
        results.push({ ...a, status: 'already present, skipped' });
        continue;
      }
      data.rosters[a.owner].push({ name: a.name, cost: a.cost, yid: a.yid || null });
      results.push({ ...a, status: 'added' });
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
