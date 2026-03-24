const META_TOKEN   = process.env.META_TOKEN;
const META_ACCOUNT = process.env.META_ACCOUNT;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { days = 7, level = 'campaign', from, to, campaign_id, adset_id } = req.query;

  let since, until;
  if (from && to) { since = from; until = to; }
  else {
    const end = new Date(), start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    since = start.toISOString().split('T')[0];
    until = end.toISOString().split('T')[0];
  }

  const levelField = level === 'adset' ? 'adset_name,adset_id'
                   : level === 'ad'    ? 'ad_name,ad_id,adset_id,adset_name,campaign_id,campaign_name'
                                       : 'campaign_name,campaign_id';
  const fields = `spend,impressions,clicks,cpm,cpc,${levelField},date_start`;

  const filters = [];
  if (adset_id)   filters.push({ field: 'adset.id',    operator: 'IN', value: [adset_id] });
  else if (campaign_id) filters.push({ field: 'campaign.id', operator: 'IN', value: [campaign_id] });
  const filterParam = filters.length
    ? `&filtering=${encodeURIComponent(JSON.stringify(filters))}` : '';

  const url = `https://graph.facebook.com/v19.0/act_${META_ACCOUNT}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=${level}&time_increment=1&limit=500&access_token=${META_TOKEN}${filterParam}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ data: data.data || [], since, until, level });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
