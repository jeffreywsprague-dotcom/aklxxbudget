const { getLeagueStore } = require('./lib/blobStore');

function baseName(n) {
  return n.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
}

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

    const removedByOwner = {};

    for (const owner of Object.keys(data.rosters)) {
      const roster = data.rosters[owner];
      const seen = new Set();
      const deduped = [];
      const removed = [];

      for (const p of roster) {
        const key = baseName(p.name);
        if (seen.has(key)) {
          removed.push(p);
        } else {
          seen.add(key);
          deduped.push(p);
        }
      }

      if (removed.length > 0) {
        data.rosters[owner] = deduped;
        removedByOwner[owner] = removed;
      }
    }

    await store.setJSON('current', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, removedByOwner }, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }),
    };
  }
};
