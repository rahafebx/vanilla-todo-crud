import { QUOTE_STORAGE_KEY, QUOTE_API } from './constants.js';
import { MOTIVE_QUOTES } from './quotes.js';

export function loadQuote() {
  const raw = localStorage.getItem(QUOTE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveQuote(quote) {
  const data = {
    date: new Date().toDateString(),
    quote,
  };
  localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(data));
}

export async function fetchAndDisplayQuote(displayQuoteFn) {
  try {
    const response = await fetch(QUOTE_API);
    if (!response.ok) throw new Error("Failed to fetch quote");

    const quote = await response.json();
    saveQuote(quote);
    displayQuoteFn(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    const fallbackQuote = getRandomFallbackQuote(MOTIVE_QUOTES);
    saveQuote(fallbackQuote);
    displayQuoteFn(fallbackQuote);
  }
}

export function displayQuote(quote, quoteText, quoteAuthor, shareQuoteBtn) {
  if(quote.data[0].quote != undefined && quote.data[0].quote != null){
    quoteText.textContent = `"${quote.data[0].quote}"`;
    quoteAuthor.textContent = `— ${quote.data[0].author || "Unknown"}`;
  }
  quoteText.classList.remove("fade");
  if (shareQuoteBtn) {
    shareQuoteBtn.classList.remove("disabled");
    shareQuoteBtn.disabled = false;
  }
}

function getRandomFallbackQuote(quotes) {
  return {"data": [quotes[Math.floor(Math.random() * quotes.length)]]};
}

export function initDailyQuote(quoteText, quoteAuthor, shareQuoteBtn, displayQuoteFn, fetchAndDisplayQuoteFn) {
  const storedData = loadQuote();
  const today = new Date().toDateString();

  if (storedData && storedData.date === today) {
    displayQuoteFn(storedData.quote, quoteText, quoteAuthor, shareQuoteBtn);
  } else {
    fetchAndDisplayQuoteFn((quote) => displayQuoteFn(quote, quoteText, quoteAuthor, shareQuoteBtn));
  }
}