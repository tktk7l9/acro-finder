import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Caching is left at the defaults. Neither ISR nor on-demand revalidate is used.
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();
