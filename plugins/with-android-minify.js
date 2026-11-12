const { withGradleProperties } = require("@expo/config-plugins");

const MINIFY_FLAGS = {
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
};

module.exports = function withAndroidMinify(config) {
  return withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(MINIFY_FLAGS)) {
      const existing = config.modResults.find((prop) => prop.key === key);
      if (existing) {
        existing.value = value;
      } else {
        config.modResults.push({ type: "property", key, value });
      }
    }
    return config;
  });
};
