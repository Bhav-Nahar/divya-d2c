import { RecentlyViewed } from '@theme/recently-viewed-products';
import { sectionRenderer } from '@theme/section-renderer';

/**
 * Fills the recently viewed section.
 *
 * The viewed ids live in localStorage, so the server cannot render this list on
 * the first pass. The section is re-requested through the Section Rendering API
 * with a `q=id:… OR id:…` search, which gives the section its products.
 */
class RecentlyViewedProducts extends HTMLElement {
  async connectedCallback() {
    const { sectionId, excludeProductId, maxProducts } = this.dataset;
    if (!sectionId) return;

    // The product being viewed shouldn't appear in its own "recently viewed" list
    const ids = RecentlyViewed.getProducts()
      .filter((id) => id !== excludeProductId)
      .slice(0, Number(maxProducts) || 4);

    if (ids.length === 0) return;

    try {
      const url = new URL(Theme.routes.search_url, location.origin);
      url.searchParams.set('q', ids.map((id) => `id:${id}`).join(' OR '));
      url.searchParams.set('resources[type]', 'product');

      const html = await sectionRenderer.getSectionHTML(sectionId, false, url);
      const replacement = new DOMParser().parseFromString(html, 'text/html').querySelector(this.tagName);

      // No matching products came back — leave the section hidden
      if (!replacement || !replacement.querySelector('.resource-list__item')) return;

      this.innerHTML = replacement.innerHTML;
      this.hidden = false;
    } catch (error) {
      // A failed lookup just means no list; the section stays hidden
      console.warn('[recently-viewed] could not load products', error);
    }
  }
}

if (!customElements.get('recently-viewed-products')) {
  customElements.define('recently-viewed-products', RecentlyViewedProducts);
}
