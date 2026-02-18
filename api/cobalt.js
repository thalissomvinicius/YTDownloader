const API_INSTANCES = [
    'https://cobalt.chip.lol/api',
    'https://dl.lp1.eu/api',
    'https://api.cobalt.adryd.com/api',
    'https://cobalt.place/api',
    'https://api.cobalt.kwiatekmiki.pl/api',
    'https://api.cobalt.tools'
];

const readRawBody = (req) => new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', text: 'method_not_allowed' });
    }

    let body = req.body;
    if (!body) {
        try {
            const raw = await readRawBody(req);
            if (raw) {
                body = raw;
            }
        } catch (_) {
            return res.status(400).json({ status: 'error', text: 'invalid_body' });
        }
    }
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (_) {
            return res.status(400).json({ status: 'error', text: 'invalid_json' });
        }
    }

    const payload = body || {};
    let lastErrorText = 'all_instances_failed';

    for (let i = 0; i < API_INSTANCES.length; i++) {
        const apiBase = API_INSTANCES[i];
        try {
            const response = await fetch(`${apiBase}/json`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data && data.status !== 'error' && (data.url || data.picker)) {
                return res.status(200).json(data);
            }
            if (data && data.status === 'error' && data.text) {
                lastErrorText = data.text;
            }
        } catch (_) {
        }
    }

    return res.status(502).json({ status: 'error', text: lastErrorText });
};
