import { defineConfig } from "vite";
import vinext from "vinext";
import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";

export default defineConfig({
  plugins: [
    vinext(),
    varlockCloudflareVitePlugin({
      configPath: "wrangler.jsonc",
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
