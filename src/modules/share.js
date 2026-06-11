export function openShareQuoteModal(quote, author, overlay, shareModal, showToastFn, ogDescriptionMetaElement, originalOgDescription) {
  if (!quote || !author) {
    showToastFn("No quote available to share.", "error");
    return;
  }

  // Update OG description for better sharing previews
  if (ogDescriptionMetaElement) {
    ogDescriptionMetaElement.setAttribute("content", `${quote} ${author}`);
    console.log("Updated OG description for sharing:", ogDescriptionMetaElement.getAttribute("content"));
  }

  overlay.classList.add("is-active");
  shareModal.classList.add("is-open");
  shareModal.querySelector(".share-quote").textContent = quote;
  shareModal.querySelector(".share-author").textContent = author;
}

export function shareQuote(quote, author, platform, overlay, shareModal, ogDescriptionMetaElement, originalOgDescription) {
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
  // closeShareModal(overlay, shareModal, ogDescriptionMetaElement, originalOgDescription);
}

export function closeShareModal(overlay, shareModal, ogDescriptionMetaElement, originalOgDescription) {
  if (shareModal) {
    if(shareModal.classList.contains("is-open")) {
      shareModal.classList.remove("is-open");

      if (ogDescriptionMetaElement && ogDescriptionMetaElement.getAttribute("content") !== originalOgDescription) {
        ogDescriptionMetaElement.setAttribute("content", originalOgDescription);
        console.log("Restored original OG description:", ogDescriptionMetaElement.getAttribute("content"));
      }
    }
  }
  if (overlay) {
    if(overlay.classList.contains("is-active")) {
      overlay.classList.remove("is-active");
    }
  }
}