//SDK利用準備
import type { MicroCMSQueries } from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

//型定義
export type Article = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  content: string;
};
export type ArticleResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Article[];
};

//APIの呼び出し
export const getArticles = async (queries?: MicroCMSQueries) => {
  return await client.get<ArticleResponse>({ endpoint: "articles", queries });
};
export const getArticleDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Article>({
    endpoint: "articles",
    contentId,
    queries,
  });
};