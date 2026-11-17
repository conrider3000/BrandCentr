import React from 'react';
import { BrandPortalClient } from '@/components/BrandPortalClient';
import { SuspendedScreen } from '@/components/SuspendedScreen';
import { maskApiKey } from '@/lib/crypto';
import { getOpenRouterPlainKey, readNodeDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default function BrandPortalPage() {
  const db = readNodeDb();

  if (db.settings.status === 'suspended') {
    return (
      <SuspendedScreen
        brandName={db.public_site_content.brand_name}
        contactEmail={db.public_site_content.contact_email}
      />
    );
  }

  const plainKey = getOpenRouterPlainKey();

  return (
    <BrandPortalClient
      initialSiteContent={db.public_site_content}
      initialRevisions={db.site_revisions}
      initialDossier={db.brand_dossier}
      initialAssets={db.brand_assets}
      initialCreations={db.brand_creations}
      initialApprovals={db.brand_approvals}
      initialChat={db.chat_history}
      initialSettings={{
        hasOpenRouterKey: Boolean(plainKey),
        openRouterKeyMasked: maskApiKey(plainKey),
        creditsExhausted: db.settings.openrouter_credits_exhausted,
        lastError: db.settings.openrouter_last_error,
        selectedModel: db.settings.selected_model,
        imageModel: db.settings.image_model,
        backups: db.settings.backups,
      }}
    />
  );
}
