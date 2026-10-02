const { getLeagueStore } = require('./lib/blobStore');

function baseName(n) {
  return n.replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function trackedMatches(tracked, real) {
  if (tracked.yid && tracked.yid === real.yid) return true;
  if (!tracked.yid) return baseName(tracked.name) === baseName(real.name);
  return false;
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

    const teams = Array.isArray(payload.teams) ? payload.teams : [];
    const store = getLeagueStore();
    const data = await store.get('current', { type: 'json' });
    if (!data) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No league data found.' }) };
    }

    const results = [];
    let totalIssues = 0;

    for (const t of teams) {
      const owner = data.teamIdMap && data.teamIdMap[t.teamId];
      if (!owner) {
        results.push({ teamId: t.teamId, error: 'Unmapped team ID' });
        totalIssues++;
        continue;
      }
      const trackedRoster = data.rosters[owner] || [];
      const players = Array.isArray(t.players) ? t.players : [];

      const missingFromTracker = players.filter(
        (real) => !trackedRoster.some((tracked) => trackedMatches(tracked, real))
      );
      const staleInTracker = trackedRoster.filter(
        (tracked) => !players.some((real) => trackedMatches(tracked, real))
      );

      if (missingFromTracker.length || staleInTracker.length) {
        totalIssues += missingFromTracker.length + staleInTracker.length;
        results.push({ owner, missingFromTracker, staleInTracker });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ checkedTeams: teams.length, totalIssues, results }, null, 2),
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
