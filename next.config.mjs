export default {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@lancedb/lancedb", "better-sqlite3"],
  },
};
