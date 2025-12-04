export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-full-stop": [0, "never"],
    "subject-max-length": [2, "always", 100],
    "footer-max-line-length": [0, "always"],
  },
};
