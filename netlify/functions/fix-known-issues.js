const { getLeagueStore } = require('./lib/blobStore');

const REMOVALS = [
  { owner: 'Jeff', name: 'Roschon Johnson (Chi - RB)' },
  { owner: 'Jeff', name: 'Raiders (LV - DEF)' },
  { owner: 'Jeff', name: 'Jacob Saylors (Det - RB)' },
  { owner: 'Leeman', name: 'Kaleb Johnson (GB - RB)' },
  { owner: 'Leeman', name: 'Tre Tucker (LV - WR)' },
  { owner: 'Brad', name: 'Will Lutz' },
  { owner: 'Dan', name: 'Jaxon Dart' },
  { owner: 'Marc', name: 'LAC DEF' },
];

function normalize(s) {
  return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
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
      const idx = roster.findIndex((p) => normalize(p.name) === normalize(r.name));
      if (idx === -1) {
        results.push({ ...r, status: 'not found on roster' });
        continue;
      }
      const removed = roster.splice(idx, 1)[0];
      results.push({ ...r, status: 'removed', cost: removed.cost });
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, results }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
