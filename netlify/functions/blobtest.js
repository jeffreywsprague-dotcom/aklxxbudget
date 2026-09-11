exports.handler = async function () {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore('akl-league');
    await store.setJSON('test-key', { hello: 'world', time: Date.now() });
    const val = await store.get('test-key', { type: 'json' });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, val }) };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }),
    };
  }
};
