const { getLeagueStore } = require('./lib/blobStore');

exports.handler = async function () {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  try {
    const store = getLeagueStore();
    const data = await store.get('current', { type: 'json' });
    if (!data) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No league data found.' }) };
    }

    const report = {};
    for (const owner of data.owners) {
      const roster = data.rosters[owner] || [];
      report[owner] = {
        count: roster.length,
        overCap: roster.length > 17,
        spent: roster.reduce((s, p) => s + p.cost, 0),
        players: roster.map((p) => `${p.name} ($${p.cost})`),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(report, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message }) };
  }
};
