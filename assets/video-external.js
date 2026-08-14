/**
 * Click-to-play handler for the external-video facade
 * (snippets/video-external.liquid). A [data-video-external] block can
 * appear multiple times on a page, each emitting its own <script src> tag
 * for this file — the window-level guard below makes registering the
 * (single, delegated) click listener idempotent no matter how many times
 * this file executes, instead of stacking N duplicate listeners
 * (failure-log pattern 7).
 */
(function () {
  if (window.__videoExternalBound) return;
  window.__videoExternalBound = true;

  document.addEventListener('click', function (event) {
    var playButton = event.target.closest('[data-video-external-play]');
    if (!playButton) return;

    var container = playButton.closest('[data-video-external]');
    if (!container || container.querySelector('iframe')) return;

    var type = container.dataset.videoType;
    var id = container.dataset.videoId;
    var autoplay = container.dataset.videoAutoplay === 'true';
    var loop = container.dataset.videoLoop === 'true';
    if (!type || !id) return;

    var src;
    if (type === 'youtube') {
      src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      if (loop) src += '&loop=1&playlist=' + id;
    } else if (type === 'vimeo') {
      src = 'https://player.vimeo.com/video/' + id + '?autoplay=1';
      if (loop) src += '&loop=1';
    } else {
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.setAttribute('frameborder', '0');

    container.innerHTML = '';
    container.appendChild(iframe);
  });
})();
