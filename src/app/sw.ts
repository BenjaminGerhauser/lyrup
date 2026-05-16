import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, Serwist } from "serwist";

// Serwist injects the precache manifest at build time via webpack.
// We augment the global scope type so TypeScript knows about __SW_MANIFEST.
declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (string | { url: string; revision: string | null })[];
  }
}

const serwist = new Serwist({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  precacheEntries: (self as any).__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Supabase API calls must NEVER be cached — always hit the network.
    {
      matcher: /^https:\/\/[^/]*\.supabase\.co\//i,
      handler: new NetworkOnly(),
    },
    // Default Next.js recommended caching strategies for everything else.
    ...defaultCache,
  ],
});

serwist.addEventListeners();
