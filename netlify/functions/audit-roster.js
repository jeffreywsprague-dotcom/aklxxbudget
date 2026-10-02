const { getLeagueStore } = require('./lib/blobStore');

function baseName(n) {
  return n.replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const key = event.headers['x-api-key'] || event.headers['X-Api-Key'];
    if (!key || key !== process.env.BOOKMARKLET_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Bad JSON body' }) };
    }

    const { teamId, players } = payload;
    if (!teamId || !Array.isArray(players)) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Need teamId and players[]' }) };
    }

    const store = getLeagueStore();
    const data = await store.get('current', { type: 'json' });
    if (!data) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No league data found.' }) };
    }

    const owner = data.teamIdMap && data.teamIdMap[teamId];
    if (!owner) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: `Team ID ${teamId} isn't mapped to any owner yet.` }) };
    }

    const trackedRoster = data.rosters[owner] || [];

    // A tracked entry "matches" a real entry if either their yahoo IDs agree,
    // or (when no ID is on file for the tracked entry) their cleaned-up names agree.
    function trackedMatches(tracked, real) {
      if (tracked.yid && tracked.yid === real.yid) return true;
      if (!tracked.yid) return baseName(tracked.name) === baseName(real.name);
      return false;
    }

    const missingFromTracker = players.filter(
      (real) => !trackedRoster.some((tracked) => trackedMatches(tracked, real))
    );
    const staleInTracker = trackedRoster.filter(
      (tracked) => !players.some((real) => trackedMatches(tracked, real))
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ owner, missingFromTracker, staleInTracker }, null, 2),
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
