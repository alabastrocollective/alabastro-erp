import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    /** Mitiga TypeError useContext null al optimizar deps en dev (RR7 + React 19). */
    unstable_optimizeDeps: true,
  },
} satisfies Config;
