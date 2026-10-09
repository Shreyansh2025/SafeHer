const { withAndroidManifest } = require("@expo/config-plugins");

const SERVICE_NAME =
  "com.asterinet.react.bgactions.RNBackgroundActionsTask";

module.exports = function withSafeHerBackgroundSos(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      return config;
    }

    // Local HTTP API is used during LAN testing; this belongs in the generated
    // manifest (not app.json, where it fails Expo's schema validation).
    application.$ = application.$ || {};
    application.$["android:usesCleartextTraffic"] = "true";

    application.service = application.service || [];

    let service = application.service.find(
      (item) => item?.$?.["android:name"] === SERVICE_NAME,
    );

    const serviceAttributes = {
      "android:name": SERVICE_NAME,
      "android:exported": "false",
      "android:stopWithTask": "false",
      "android:foregroundServiceType": "microphone|location|specialUse",
    };

    if (!service) {
      service = { $: serviceAttributes };
      application.service.push(service);
    } else {
      service.$ = {
        ...service.$,
        ...serviceAttributes,
      };
    }

    service.property = service.property || [];

    const specialUseProperty =
      "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE";

    const existingProperty = service.property.find(
      (item) => item?.$?.["android:name"] === specialUseProperty,
    );

    const property = {
      "android:name": specialUseProperty,
      "android:value":
        "SafeHer emergency background voice and motion trigger",
    };

    if (existingProperty) {
      existingProperty.$ = property;
    } else {
      service.property.push({ $: property });
    }

    return config;
  });
};
