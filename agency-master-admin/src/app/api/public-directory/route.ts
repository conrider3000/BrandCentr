import { NextResponse } from 'next/server';
import { listClients } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clients = listClients()
    .filter((c) => c.status !== 'suspended')
    .map((c) => {
      const baseNodeUrl =
        c.node_url_override || `https://marca.${c.root_domain}`;
      const portalUrl = c.node_url_override
        ? `${c.node_url_override.replace(/\/+$/, '')}/portal`
        : `https://marca.${c.root_domain}`;
      const siteUrl = c.node_url_override
        ? c.node_url_override.replace(/\/+$/, '')
        : `https://${c.root_domain}`;

      return {
        id: c.id,
        brand_name: c.brand_name,
        root_domain: c.root_domain,
        base_url: baseNodeUrl,
        portal_url: portalUrl,
        site_url: siteUrl,
      };
    });

  return NextResponse.json({ brands: clients });
}
