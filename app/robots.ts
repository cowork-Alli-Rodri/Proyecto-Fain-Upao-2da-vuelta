import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/candidatos", "/no-te-dejes-sorprender", "/inicio", "/como-funciona"],
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/cuestionario",
          "/cuestionario/",
          "/preferencia",
          "/encuesta-final",
          "/cierre",
          "/consent",
          "/profile",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
