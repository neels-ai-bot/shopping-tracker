export interface SharedListData {
  name: string;
  items: { name: string; quantity: number }[];
  sharedBy?: string;
  sharedAt: string;
}

/**
 * Encode list data to a shareable URL using base64 encoding of JSON.
 * Returns a relative URL like `/list?shared=BASE64_DATA`
 */
export function encodeListToUrl(data: SharedListData): string {
  const json = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `/list?shared=${base64}`;
}

/**
 * Decode base64 data from a shared URL back into SharedListData.
 * Returns null if the data is invalid or cannot be parsed.
 */
export function decodeListFromUrl(encoded: string): SharedListData | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const data = JSON.parse(json) as SharedListData;

    // Validate the required structure
    if (
      typeof data.name !== "string" ||
      !Array.isArray(data.items) ||
      typeof data.sharedAt !== "string"
    ) {
      return null;
    }

    // Validate each item has name and quantity
    for (const item of data.items) {
      if (typeof item.name !== "string" || typeof item.quantity !== "number") {
        return null;
      }
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Share a list using the Web Share API if available,
 * otherwise copy the URL to the clipboard.
 */
export async function shareList(data: SharedListData): Promise<void> {
  const relativePath = encodeListToUrl(data);
  const fullUrl = `${window.location.origin}${relativePath}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Shopping List from ${data.sharedBy || "Someone"}`,
        text: `Check out this shopping list with ${data.items.length} item${data.items.length !== 1 ? "s" : ""}!`,
        url: fullUrl,
      });
    } catch (err) {
      // User cancelled or share failed — fall back to clipboard
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      await copyToClipboard(fullUrl);
    }
  } else {
    await copyToClipboard(fullUrl);
  }
}

async function copyToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("Share link copied to clipboard!");
  }
}
