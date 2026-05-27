import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/inicio", changeFrequency: "weekly", priority: 0.9 },
  { path: "/candidatos", changeFrequency: "daily", priority: 0.9 },
  { path: "/no-te-dejes-sorprender", changeFrequency: "daily", priority: 0.8 },
  { path: "/como-funciona", changeFrequency: "monthly", priority: 0.6 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
