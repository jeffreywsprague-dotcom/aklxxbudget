const { getLeagueStore } = require('./lib/blobStore');

function baseName(n) {
  return n.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
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
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad JSON body' }) };
    }

    const moves = Array.isArray(payload.moves) ? payload.moves : [];
    const dryRun = payload.dryRun === true;
    const store = getLeagueStore();
    let liveData = await store.get('current', { type: 'json' });
    if (!liveData) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No league data yet — load the tracker page once first, then retry.' }),
      };
    }
    const data = dryRun ? JSON.parse(JSON.stringify(liveData)) : liveData;

    data.processedTx = data.processedTx || [];
    const applied = [];
    const skippedDup = [];
    const notFound = [];
    const unmappedTeam = [];

    for (const mv of moves) {
      if (!mv || !mv.uid || !mv.type) continue;
      if (!dryRun && data.processedTx.includes(mv.uid)) {
        skippedDup.push(mv);
        continue;
      }

      if (mv.type === 'add') {
        const owner = data.teamMap[mv.team];
        if (!owner) {
          unmappedTeam.push(mv);
          continue;
        }
        const fullName = mv.pos ? `${mv.player} (${mv.pos})` : mv.player;
        data.rosters[owner].push({ name: fullName, cost: mv.cost });
        applied.push(mv);
        data.processedTx.push(mv.uid);
      } else if (mv.type === 'drop') {
        const owner = data.teamMap[mv.team];
        if (!owner) {
          unmappedTeam.push(mv);
          continue;
        }
        const idx = data.rosters[owner].findIndex((p) => baseName(p.name) === baseName(mv.player));
        if (idx === -1) {
          notFound.push(mv);
        } else {
          data.rosters[owner].splice(idx, 1);
          applied.push(mv);
        }
        data.processedTx.push(mv.uid);
      } else if (mv.type === 'trade_leg') {
        const toOwner = data.teamMap[mv.toTeam];
        if (!toOwner) {
          unmappedTeam.push(mv);
          continue;
        }
        let cost = null;
        let fromOwner = null;
        let fromIdx = -1;
        for (const [owner, roster] of Object.entries(data.rosters)) {
          const idx = roster.findIndex((p) => baseName(p.name) === baseName(mv.player));
          if (idx !== -1) {
            fromOwner = owner;
            fromIdx = idx;
            cost = roster[idx].cost;
            break;
          }
        }
        if (fromOwner) data.rosters[fromOwner].splice(fromIdx, 1);
        const fullName = mv.pos ? `${mv.player} (${mv.pos})` : mv.player;
        data.rosters[toOwner].push({ name: fullName, cost: cost == null ? 3 : cost });
        if (cost == null) notFound.push(mv);
        applied.push(mv);
        data.processedTx.push(mv.uid);
      }
    }

    if (!dryRun) {
      await store.setJSON('current', data);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        dryRun,
        appliedCount: applied.length,
        skippedDupCount: skippedDup.length,
        notFound,
        unmappedTeam,
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ crashed: true, message: err.message, stack: err.stack }),
    };
  }
};
