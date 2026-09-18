const { getLeagueStore } = require('./lib/blobStore');

const REMOVALS = [
  { owner: 'Leeman', name: 'Kaleb Johnson (GB - RB)' },
];

function normalize(s) {
  return s.replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
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

    const results = [];
    for (const r of REMOVALS) {
      const roster = data.rosters[r.owner];
      if (!roster) {
        results.push({ ...r, status: 'owner not found' });
        continue;
      }
      const before = roster.length;
      data.rosters[r.owner] = roster.filter((p) => normalize(p.name) !== normalize(r.name));
      const removedCount = before - data.rosters[r.owner].length;
      if (removedCount === 0) {
        results.push({ ...r, status: 'not found on roster' });
      } else {
        results.push({ ...r, status: 'removed', count: removedCount });
      }
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
