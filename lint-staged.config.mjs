const config = {
  "*.{ts,tsx,mjs,js}": ["eslint --max-warnings 0 --no-warn-ignored --fix", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
  "{src,content,supabase}/**/*": () => "node scripts/check-copy.mjs",
};

export default config;
