import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import * as Location from 'expo-location';

import { WebView } from 'react-native-webview';


export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error(
        'Map location error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Location could not be loaded.
        </Text>
      </View>
    );
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport"
          content="width=device-width,
          initial-scale=1.0,
          maximum-scale=1.0,
          user-scalable=no" />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
          }

          #map {
            height: 100%;
            width: 100%;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script>
          const latitude = ${location.latitude};
          const longitude = ${location.longitude};

          const map = L.map('map').setView(
            [latitude, longitude],
            16
          );

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution:
                '&copy; OpenStreetMap contributors'
            }
          ).addTo(map);

          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(
              '<b>SafeHer</b><br/>Your current location'
            )
            .openPopup();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>
          SafeHer Map
        </Text>

        <Text style={styles.subtitle}>
          Your current location
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    padding: 18,
    paddingTop: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#777',
  },

  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
  },

  errorText: {
    fontSize: 16,
    color: 'red',
  },
});