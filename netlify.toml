const { getLeagueStore } = require('./lib/blobStore');

// owner -> normalized draft-day player name -> Yahoo player ID
const DRAFT_ID_LOOKUP = {"Jeff": {"lutherburdeniii": "41824", "jaylenwaddle": "33394", "quinshonjudkins": "41821", "treymcbride": "34010", "maliknabers": "40899", "breecehall": "33991", "marvinharrisonjr": "40893", "makailemon": "42642", "blakecorum": "40962", "kylemonangai": "42025", "kylermurray": "31833", "jaredgoff": "29235", "eliraridon": "42717", "jonahcoleman": "42730", "braelonallen": "40981", "emmettjohnson": "42796", "cyrusallen": "42773"}, "Tony": {"joshallen": "30977", "ricodowdle": "33100", "omarionhampton": "41807", "brandonaubrey": "40819", "ceedeelamb": "32687", "joshjacobs": "31856", "traviskelce": "26686", "michaelpittmanjr": "32704", "aaronjonessr": "30295", "hunterhenry": "29269", "alecpierce": "34008", "romeodoubs": "34088", "jordyntyson": "42630", "keatonmitchell": "40641", "deebosamuelsr": "31868", "tjhockenson": "31840"}, "Marc": {"jamescookiii": "34019", "georgepickens": "34007", "amonrastbrown": "33500", "jalenhurts": "32723", "dandreswift": "32705", "kylepittssr": "33392", "rhamondrestevenson": "33508", "michaelwilson": "40121", "dallasgoedert": "31019", "jaydenreed": "40063", "bonix": "40875", "keenanallen": "26699", "jakobilane": "42702", "woodymarks": "41902", "kimanividal": "41052", "tretucker": "40114"}, "Adam": {"travisetiennejr": "33413", "chasebrown": "40196", "nicocollins": "33477", "carnelltate": "42626", "dakprescott": "29369", "zayflowers": "40039", "samlaporta": "40064", "javontewilliams": "33423", "tuckerkraft": "40102", "kcconcepcionjr": "42646", "jordanmason": "34320", "evanmcpherson": "33537"}, "Dan": {"drakelondon": "33963", "devontasmith": "33398", "laddmcconkey": "40908", "christianmccaffrey": "30121", "davidmontgomery": "31905", "jadarianprice": "42654", "zachcharbonnet": "40075", "brockpurdy": "34218", "jasonmyers": "28378", "khalilshakir": "34104", "chigokonkwo": "34099", "brianrobinson": "34054", "brentonstrange": "40078"}, "Ken": {"saquonbarkley": "30972", "romeodunze": "40901", "tylerwarren": "41799", "lamarjackson": "31002", "teehiggins": "32703", "christianwatson": "33989", "mikeevans": "27535", "buckyirving": "40993", "jacorycroskeymerritt": "42010", "jordanaddison": "40042", "jalencoker": "41293", "markandrews": "31056", "marshawnlloyd": "40971", "tylerloop": "41988", "tankbigsby": "40095", "jaydonblue": "41935"}, "Randy": {"jamarrchase": "33393", "djmoore": "30994", "kennethwalker": "33996", "jeremiyahlove": "42625", "davanteadams": "27581", "haroldfanninjr": "41877", "calebwilliams": "40900", "mikewashingtonjr": "42744", "courtlandsutton": "31010", "patrickmahomes": "30123", "dezhaunstribling": "42655", "kenyonsadiq": "42638", "camerondicker": "34344", "kylewilliams": "41864", "isiahpacheco": "34207"}, "Brad": {"justinjefferson": "32692", "camskattebo": "41922", "colstonloveland": "41795", "ashtonjeanty": "41791", "drakemaye": "40881", "treveyonhenderson": "41823", "rasheerice": "40084", "dkmetcalf": "31896", "tonypollard": "31960", "malachifields": "42696", "rjharvey": "41845", "travishunter": "41787", "quentinjohnston": "40051", "bakermayfield": "30971", "juwanjohnson": "33113", "tyjaespears": "40119", "tyronetracyjr": "41048"}, "Ryan": {"jahmyrgibbs": "40059", "brockbowers": "40878", "emekaegbuka": "41804", "bhayshultuten": "41900", "trevorlawrence": "33389", "parkerwashington": "40234", "justinherbert": "32676", "jaylenwarren": "34447", "jonathonbrooks": "40926", "wandalerobinson": "33998", "stefondiggs": "28534", "jakebates": "40835", "joshdowns": "40126", "xavierworthy": "40877", "matthewgolden": "41808", "dylansampson": "41907"}, "Leeman": {"jonathantaylor": "32711", "kyrenwilliams": "34120", "jaxonsmithnjigba": "40041", "jaxsondart": "41810", "tetairoamcmillan": "41793", "chubahubbard": "33514", "jakobimeyers": "32231", "matthewstafford": "9265", "calebdouglas": "42697", "najeeharris": "33412", "orondegadsden": "41951", "nicholassingleton": "42763", "sethmcgowan": "42859"}, "Matt": {"devonachane": "40118", "chrisolave": "33966", "terrymclaurin": "31908", "bijanrobinson": "40055", "jaydendaniels": "40896", "garrettwilson": "33965", "georgekittle": "30259", "brianthomasjr": "40883", "kennygainwell": "33538", "rachaadwhite": "34047", "camlittle": "41062", "chrisrodriguezjr": "40231", "tylerallgeier": "34107", "jakeferguson": "34085", "denzelboston": "42661", "rashidshaheed": "34659"}, "CMAC": {"joeburrow": "32671", "pukanacua": "40168", "jamesonwilliams": "33967", "derrickhenry": "29279", "ajbrown": "31883", "jkdobbins": "32725", "daltonkincaid": "40048", "chrisgodwinjr": "30197", "isaiahlikely": "34095", "kaimifairbairn": "29792", "alvinkamara": "30180", "jordanlove": "32696", "raydavis": "40980"}};

function norm(n) {
  return n.replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
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

    const backfilled = {};
    for (const owner of Object.keys(data.rosters)) {
      const ownerLookup = DRAFT_ID_LOOKUP[owner] || {};
      let count = 0;
      for (const p of data.rosters[owner]) {
        if (p.yid) continue; // already has an ID, leave it alone
        const key = norm(p.name);
        if (ownerLookup[key]) {
          p.yid = 'p:' + ownerLookup[key];
          count++;
        }
      }
      if (count > 0) backfilled[owner] = count;
    }

    await store.setJSON('current', data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, backfilled }, null, 2) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, message: err.message, stack: err.stack }) };
  }
};
