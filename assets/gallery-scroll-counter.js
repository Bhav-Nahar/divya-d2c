/**
 * Displays the index of the gallery image currently in view, paired with the
 * total count, e.g. "02 · 06".
 *
 * Only used by the two-column grid gallery with a pinned first image: the
 * counter sits on the pinned image while the remaining images scroll past it,
 * so it reports which of those the viewer has reached.
 */
class GalleryScrollCounter extends HTMLElement {
  /** Distance below the pinned image's top edge that counts as "in view". */
  static READING_OFFSET = 32;

  #mediaItems = [];
  #current = null;
  #frame = null;

  connectedCallback() {
    this.currentEl = this.querySelector('[data-gallery-counter-current]');

    const gallery = this.closest('media-gallery');
    this.#mediaItems = gallery
      ? Array.from(gallery.querySelectorAll('.media-gallery__grid .product-media-container'))
      : [];

    if (!this.currentEl || this.#mediaItems.length < 2) return;

    this.update();

    // Above 990px the theme scrolls `.page-wrapper` rather than the window, so
    // listen in the capture phase to catch scroll from whichever element owns it.
    document.addEventListener('scroll', this.handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', this.handleScroll, { passive: true });
  }

  disconnectedCallback() {
    document.removeEventListener('scroll', this.handleScroll, { capture: true });
    window.removeEventListener('resize', this.handleScroll);
    if (this.#frame) cancelAnimationFrame(this.#frame);
  }

  handleScroll = () => {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      this.update();
    });
  };

  /**
   * The active image is the last one whose top edge has crossed the reading
   * line, so the counter advances as each image settles into view.
   */
  update() {
    const [pinned] = this.#mediaItems;
    // The pinned image sits at the sticky offset, so measuring from it keeps the
    // reading line correct without needing to know the header's height.
    const line = pinned.getBoundingClientRect().top + GalleryScrollCounter.READING_OFFSET;
    let index = 0;

    for (let i = 0; i < this.#mediaItems.length; i++) {
      if (this.#mediaItems[i].getBoundingClientRect().top <= line) index = i;
      else break;
    }

    if (index === this.#current) return;
    this.#current = index;
    this.currentEl.textContent = String(index + 1).padStart(2, '0');
  }
}

if (!customElements.get('gallery-scroll-counter')) {
  customElements.define('gallery-scroll-counter', GalleryScrollCounter);
}
