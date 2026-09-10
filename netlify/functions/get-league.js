const { getStore } = require('@netlify/blobs');
const DEFAULT_DATA = require('../../default-data.json');

exports.handler = async function () {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  try {
    const store = getStore('akl-league');
    let data = await store.get('current', { type: 'json' });
    if (!data) {
      data = DEFAULT_DATA;
      await store.setJSON('current', data);
    }
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
