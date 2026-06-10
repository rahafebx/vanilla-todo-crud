export function openShareQuoteModal(quote, author, overlay, shareModal, showToastFn) {
  if (!quote || !author) {
    showToastFn("No quote available to share.", "error");
    return;
  }

  overlay.classList.add("is-active");
  shareModal.classList.add("is-open");
  shareModal.querySelector(".share-quote").textContent = quote;
  shareModal.querySelector(".share-author").textContent = author;
}

export function shareQuote(quote, author, platform, overlay, shareModal) {
  if (!quote || !author) {
    return;
  }
  const text = `${quote} ${author}`;
  let shareUrl = "";
  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      break;
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(document.location.href)}&quote=${encodeURIComponent(text)}`;
      break;
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(document.location.href)}&summary=${encodeURIComponent(text)}`;
      break;
    case "whatsapp":
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + document.location.href)}`;
      break;
    default:
      console.warn("Unsupported share platform:", platform);
      return;
  }
  window.open(shareUrl, "_blank", "noopener");
  closeShareModal(overlay, shareModal);
}

export function closeShareModal(overlay, shareModal) {
  if (shareModal) shareModal.classList.remove("is-open");
  if (overlay) overlay.classList.remove("is-active");
}