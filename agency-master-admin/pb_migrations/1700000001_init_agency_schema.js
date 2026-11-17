/// <reference path="../pb_data/types.d.ts" />

// PocketBase v0.25+ migration: cria a coleção de clientes e registros de telemetria
migrate(
  (app) => {
    const collection = new Collection({
      name: 'clients',
      type: 'base',
      listRule: null, // Admin-only
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'brand_name', type: 'text', required: true },
        { name: 'root_domain', type: 'text', required: true },
        { name: 'vps_ip', type: 'text', required: true },
        { name: 'coolify_app_uuid', type: 'text' },
        { name: 'heartbeat_secret_encrypted', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['active', 'provisioning', 'suspended'],
          maxSelect: 1,
        },
        { name: 'renewal_date', type: 'text' },
        { name: 'annual_installment_status', type: 'text' },
        { name: 'monthly_fee_brl', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'online', type: 'bool' },
        { name: 'disk_used_gb', type: 'number' },
        { name: 'disk_total_gb', type: 'number' },
        { name: 'ram_percent', type: 'number' },
        { name: 'assets_count', type: 'number' },
        { name: 'ai_messages_count', type: 'number' },
        { name: 'creations_count', type: 'number' },
        { name: 'approvals_count', type: 'number' },
        { name: 'openrouter_ok', type: 'bool' },
        { name: 'last_heartbeat_at', type: 'text' },
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients');
    if (collection) {
      app.delete(collection);
    }
  }
);
