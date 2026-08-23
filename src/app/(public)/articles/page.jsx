import React from 'react';
import ArticlesPageClient from '@/components/article/ArticlesPageClient';
import { getPublishedArticles } from '@/lib/articles';

export default async function ArtikelPage() {
  const articles = await getPublishedArticles(50);
  return <ArticlesPageClient initialArticles={articles} />;
}