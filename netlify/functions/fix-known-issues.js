const { getLeagueStore } = require('./lib/blobStore');

// match: 'contains' removes any entry on that owner's roster whose cleaned-up name
// includes the text (useful when the full stored name isn't known). Default is an
// exact match on the cleaned-up name. Repeating an already-applied removal is harmless.
const REMOVALS = [
  { owner: 'Marc', name: 'Pat Bryant' },
  { owner: 'Marc', name: 'Nick Folk' },
  { owner: 'Marc', name: 'Colts', match: 'contains' },
  { owner: 'Marc', name: 'Higbee', match: 'contains' },
  { owner: 'Jeff', name: 'Kalif Raymond', match: 'contains' },
  { owner: 'Jeff', name: 'Okonkwo', match: 'contains' },
  { owner: 'Jeff', name: 'Darnell Washington', match: 'contains' },
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
      const target = normalize(r.name);
      const isMatch = (p) =>
        r.match === 'contains' ? normalize(p.name).includes(target) : normalize(p.name) === target;
      const removed = roster.filter(isMatch);
      data.rosters[r.owner] = roster.filter((p) => !isMatch(p));
      if (removed.length === 0) {
        results.push({ ...r, status: 'not found on roster' });
      } else {
        results.push({ ...r, status: 'removed', count: removed.length, removedNames: removed.map((p) => p.name) });
      }
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
