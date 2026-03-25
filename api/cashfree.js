const CF_APP_ID = process.env.CF_APP_ID;
const CF_SECRET = process.env.CF_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { days = 7, from, to } = req.query;

  let since, until;
  if (from && to) {
    since = from;
    until = to;
  } else {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    since = start.toISOString().split('T')[0];
    until = end.toISOString().split('T')[0];
  }

  const headers = {
    'x-api-version': '2025-01-01',
    'x-client-id': CF_APP_ID,
    'x-client-secret': CF_SECRET,
    'Content-Type': 'application/json'
  };

  function getPlan(amt) {
    if (amt <= 99)  return 'daily';
    if (amt <= 499) return 'monthly';
    return 'yearly';
  }

  try {
    let totalRevenue = 0;
    let totalOrders  = 0;
    const dailyRevenue = {};
    const dailyOrders  = {};
    const planCounts  = { daily:0, monthly:0, yearly:0 };
    const planRevenue = { daily:0, monthly:0, yearly:0 };
    let cursor = null;

    do {
      const body = {
        pagination: { limit: 200, ...(cursor ? { cursor } : {}) },
        filters: {
          start_date: `${since}T00:00:00Z`,
          end_date:   `${until}T23:59:59Z`
        }
      };

      const response = await fetch('https://api.cashfree.com/pg/recon', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const raw = await response.json();

      if (!response.ok) {
        return res.status(200).json({
          totalRevenue: 0, totalOrders: 0, dailyRevenue: {}, dailyOrders: {}, since, until,
          error: raw.message
        });
      }

      const items = raw.data || [];
      for (const item of items) {
        const ev = item.event_details || {};
        // Only count successful incoming payments (not settlements, not drops)
        if (ev.event_type === 'PAYMENT' && ev.event_status === 'SUCCESS' && ev.sale_type === 'CREDIT') {
          const amt = parseFloat(ev.event_amount || 0);
          if (amt > 0) {
            totalRevenue += amt;
            totalOrders++;
            const plan = getPlan(amt);
            planCounts[plan]++;
            planRevenue[plan] += amt;
            const day = (ev.event_time || '').split('T')[0];
            if (day) {
              dailyRevenue[day] = (dailyRevenue[day] || 0) + amt;
              dailyOrders[day]  = (dailyOrders[day]  || 0) + 1;
            }
          }
        }
      }

      cursor = (raw.cursor && items.length === 200) ? raw.cursor : null;

    } while (cursor);

    return res.status(200).json({ totalRevenue, totalOrders, dailyRevenue, dailyOrders, planCounts, planRevenue, since, until });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
