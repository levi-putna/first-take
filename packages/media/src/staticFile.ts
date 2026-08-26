/**
 * Resolve a public asset path. During render/preview the base URL is injected
 * via window.__STORYBOARD_ASSET_BASE__ (trailing slash optional).
 */
export function staticFile(path: string): string {
  const cleaned = path.replace(/^\//, "");
  if (typeof window !== "undefined") {
    const base =
      (window as unknown as { __STORYBOARD_ASSET_BASE__?: string })
        .__STORYBOARD_ASSET_BASE__ ?? "/";
    const normalised = base.endsWith("/") ? base : `${base}/`;
    return `${normalised}${cleaned}`;
  }
  return `/${cleaned}`;
}
