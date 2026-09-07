import { useEffect } from "react";

/**
 * Custom React hook to dynamically update HTML head meta tags for SEO.
 * @param {object} seoParams
 * @param {string} seoParams.title - Document title
 * @param {string} seoParams.description - Page meta description
 * @param {string} [seoParams.canonicalUrl] - Canonical page URL
 * @param {string} [seoParams.ogType] - Open Graph page type (default: 'website')
 */
export function useSEO({ title, description, canonicalUrl, ogType = "website" }) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = `${title} | Reservo — Online Luxury Booking & AI Itineraries`;
    }

    // 2. Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.content = description;
    }

    // 3. Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl || window.location.href;

    // 4. Update OpenGraph Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = title ? `${title} | Reservo` : "Reservo";

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description || "Connect • Book • Relax • Revisit";

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.content = canonicalUrl || window.location.href;

    // 5. Update Twitter Cards
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement("meta");
      twitterTitle.name = "twitter:title";
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.content = title ? `${title} | Reservo` : "Reservo";

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement("meta");
      twitterDesc.name = "twitter:description";
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.content = description || "Connect • Book • Relax • Revisit";
  }, [title, description, canonicalUrl, ogType]);
}
