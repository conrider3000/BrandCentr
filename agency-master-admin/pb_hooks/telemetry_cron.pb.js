/// <reference path="../pb_data/types.d.ts" />

// ==============================================================================
// PocketBase Cron Job — Live Fleet Telemetry (a cada 5 minutos)
// Consulta https://marca.{root_domain}/api/agency-heartbeat em toda a frota.
// ==============================================================================

cronAdd('poll_fleet_telemetry', '*/5 * * * *', () => {
  try {
    const clients = $app.findAllRecords('clients');
    for (const client of clients) {
      const domain = client.getString('root_domain');
      if (!domain) continue;

      const url = `https://marca.${domain}/api/agency-heartbeat`;
      const secret = client.getString('heartbeat_secret_encrypted');

      try {
        const res = $http.send({
          url: url,
          method: 'GET',
          headers: {
            'X-Agency-Heartbeat-Secret': secret,
          },
          timeout: 8,
        });

        if (res.statusCode === 200 && res.json) {
          client.set('online', true);
          client.set('disk_used_gb', res.json.disk?.usedGb ?? 0);
          client.set('disk_total_gb', res.json.disk?.totalGb ?? 50);
          client.set('ram_percent', res.json.ram?.usedPercent ?? 0);
          client.set('assets_count', res.json.counts?.assets ?? 0);
          client.set('ai_messages_count', res.json.counts?.aiMessages ?? 0);
          client.set('creations_count', res.json.counts?.creations ?? 0);
          client.set('approvals_count', res.json.counts?.approvals ?? 0);
          client.set('openrouter_ok', Boolean(res.json.openrouterConfigured));
          client.set('last_heartbeat_at', new Date().toISOString());
          $app.save(client);
        } else {
          client.set('online', false);
          $app.save(client);
        }
      } catch (err) {
        client.set('online', false);
        $app.save(client);
      }
    }
  } catch (e) {
    console.log('[Fleet Telemetry Cron] Erro:', e);
  }
});
