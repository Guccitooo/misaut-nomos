import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    // 1. Get list of sites
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const sitesData = await sitesRes.json();

    if (!sitesData.siteEntry || sitesData.siteEntry.length === 0) {
      return Response.json({ error: 'No sites found in Search Console' }, { status: 404 });
    }

    // Pick the first verified site
    const site = sitesData.siteEntry.find(s => s.permissionLevel !== 'siteUnverifiedUser') || sitesData.siteEntry[0];
    const siteUrl = site.siteUrl;

    // Date range: last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    const fmt = (d) => d.toISOString().split('T')[0];

    // 2. Top queries overall (professional hiring related)
    const queriesPayload = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['query'],
      rowLimit: 500,
      startRow: 0,
    };

    const queriesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(queriesPayload),
      }
    );
    const queriesData = await queriesRes.json();

    // 3. Performance by page
    const pagesPayload = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['page'],
      rowLimit: 50,
    };

    const pagesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(pagesPayload),
      }
    );
    const pagesData = await pagesRes.json();

    // 4. Performance over time (daily clicks + impressions)
    const trendsPayload = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['date'],
      rowLimit: 90,
    };

    const trendsRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(trendsPayload),
      }
    );
    const trendsData = await trendsRes.json();

    // 5. Filter professional hiring keywords
    const hiringKeywords = [
      'autónomo', 'autonomo', 'fontanero', 'electricista', 'pintor', 'carpintero',
      'jardinero', 'limpieza', 'reformas', 'albañil', 'instalador', 'técnico',
      'profesional', 'contratar', 'contratar profesional', 'buscar autonomo',
      'buscar fontanero', 'buscar electricista', 'presupuesto', 'servicio',
      'plomero', 'cerrajero', 'climatización', 'aire acondicionado',
    ];

    const allQueries = queriesData.rows || [];

    const professionalQueries = allQueries.filter(row => {
      const q = row.keys[0].toLowerCase();
      return hiringKeywords.some(kw => q.includes(kw));
    });

    const otherQueries = allQueries.filter(row => {
      const q = row.keys[0].toLowerCase();
      return !hiringKeywords.some(kw => q.includes(kw));
    });

    // Aggregate totals
    const sumMetrics = (rows) => rows.reduce((acc, r) => ({
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
    }), { clicks: 0, impressions: 0 });

    const profTotals = sumMetrics(professionalQueries);
    const otherTotals = sumMetrics(otherQueries);

    return Response.json({
      siteUrl,
      dateRange: { start: fmt(startDate), end: fmt(endDate) },
      totals: sumMetrics(allQueries),
      professionalKeywords: {
        totals: profTotals,
        avgCtr: professionalQueries.length > 0
          ? (professionalQueries.reduce((a, r) => a + r.ctr, 0) / professionalQueries.length * 100).toFixed(2)
          : 0,
        avgPosition: professionalQueries.length > 0
          ? (professionalQueries.reduce((a, r) => a + r.position, 0) / professionalQueries.length).toFixed(1)
          : 0,
        rows: professionalQueries.slice(0, 50).map(r => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: (r.ctr * 100).toFixed(2),
          position: r.position.toFixed(1),
        })),
      },
      otherKeywords: {
        totals: otherTotals,
        rows: otherQueries.slice(0, 20).map(r => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: (r.ctr * 100).toFixed(2),
          position: r.position.toFixed(1),
        })),
      },
      topPages: (pagesData.rows || []).slice(0, 20).map(r => ({
        page: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(2),
        position: r.position.toFixed(1),
      })),
      trends: (trendsData.rows || []).map(r => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: (r.ctr * 100).toFixed(2),
        position: r.position.toFixed(1),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});