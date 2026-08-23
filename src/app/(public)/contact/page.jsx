import React from 'react';
import ContactContent from '@/components/contact/ContactContent';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getWebsiteSettings } from '@/lib/settings';

export default async function HubungiKamiPage() {
  const settings = await getWebsiteSettings();
  return (
    <PageLayoutWrapper>
      <ContactContent initialSettings={settings} />
    </PageLayoutWrapper>
  );
}

