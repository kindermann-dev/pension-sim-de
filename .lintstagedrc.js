export default {
  "*.{js,jsx,ts,tsx}": ["oxlint --fix"],
  "*.{css,scss}": ["stylelint --fix"],
  "*.{html,md,js,jsx,ts,tsx,css,scss}": ["prettier --write"],
};
