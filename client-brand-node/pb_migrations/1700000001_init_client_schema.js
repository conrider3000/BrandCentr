/// <reference path="../pb_data/types.d.ts" />

// PocketBase v0.25+ migration: esquema oficial do Client Brand Node
migrate(
  (app) => {
    const publicSite = new Collection({
      name: 'public_site_content',
      type: 'base',
      listRule: '',
      viewRule: '',
      fields: [
        { name: 'brand_name', type: 'text', required: true },
        { name: 'hero_title', type: 'text', required: true },
        { name: 'hero_subtitle', type: 'text' },
        { name: 'hero_cta_label', type: 'text' },
        { name: 'about_text', type: 'text' },
        { name: 'contact_email', type: 'text' },
        { name: 'whatsapp_number', type: 'text' },
        { name: 'primary_color', type: 'text' },
        { name: 'secondary_color', type: 'text' },
        { name: 'background_color', type: 'text' },
      ],
    });
    app.save(publicSite);

    const assets = new Collection({
      name: 'brand_assets',
      type: 'base',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['Design Kit', 'Media Kit', 'Logos', 'Templates', 'Manual', 'Key Visuals'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'file_name', type: 'text', required: true },
        { name: 'file_size_bytes', type: 'number' },
      ],
    });
    app.save(assets);

    const creations = new Collection({
      name: 'brand_creations',
      type: 'base',
      fields: [
        { name: 'piece_type', type: 'text', required: true },
        { name: 'intention', type: 'text', required: true },
        { name: 'draft_copy', type: 'text' },
        { name: 'visual_idea', type: 'text' },
        { name: 'precheck_passed', type: 'bool' },
        { name: 'approved_prompt', type: 'text' },
        { name: 'generated_svg_or_url', type: 'text' },
      ],
    });
    app.save(creations);

    const approvals = new Collection({
      name: 'brand_approvals',
      type: 'base',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'source_type', type: 'text' },
        { name: 'score', type: 'number' },
        { name: 'decision', type: 'text' },
        { name: 'report_json', type: 'json' },
      ],
    });
    app.save(approvals);
  },
  (app) => {
    for (const name of ['brand_approvals', 'brand_creations', 'brand_assets', 'public_site_content']) {
      const col = app.findCollectionByNameOrId(name);
      if (col) app.delete(col);
    }
  }
);
