import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import * as Location from 'expo-location';

import { WebView } from 'react-native-webview';

import { COLORS } from '../utils/constants';

import { socket } from '../services/socket';


export default function MapScreen() {

  const webViewRef =
    useRef(null);

  const [loading, setLoading] =
    useState(true);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [isFollowing, setIsFollowing] =
    useState(true);


  // =========================================================
  // LEAFLET MAP HTML
  // =========================================================

  const mapHtml = useMemo(() => `

<!DOCTYPE html>

<html>

<head>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />


  <style>

    html,
    body,
    #map {

      height: 100%;
      width: 100%;

      margin: 0;
      padding: 0;

    }


    body {

      overflow: hidden;

      font-family:
        Arial,
        sans-serif;

    }


    /* Remove default focus outlines */

    * {

      outline: none;

    }


    /* Custom SOS marker */

    .sos-marker {

      width: 22px;
      height: 22px;

      border-radius: 50%;

      background: #ef4444;

      border: 4px solid #ffffff;

      box-shadow:
        0 0 0 3px rgba(239,68,68,0.25),
        0 3px 12px rgba(0,0,0,0.35);

      position: relative;

    }


    .sos-marker::before {

      content: '';

      position: absolute;

      width: 34px;
      height: 34px;

      top: -10px;
      left: -10px;

      border-radius: 50%;

      border: 2px solid rgba(239,68,68,0.45);

      animation:
        sosPulse 1.8s infinite;

    }


    @keyframes sosPulse {

      0% {

        transform: scale(0.7);

        opacity: 1;

      }

      70% {

        transform: scale(1.35);

        opacity: 0;

      }

      100% {

        transform: scale(1.35);

        opacity: 0;

      }

    }


    .leaflet-control-zoom {

      border: none !important;

      box-shadow:
        0 3px 12px
        rgba(0,0,0,0.20) !important;

    }


    .leaflet-control-zoom a {

      width: 42px !important;
      height: 42px !important;

      line-height: 42px !important;

      font-size: 24px !important;

      color: #111827 !important;

      background: #ffffff !important;

    }


    .leaflet-control-scale-line {

      background:
        rgba(255,255,255,0.85);

      border:
        2px solid #374151;

      border-top:
        none;

      color:
        #111827;

    }

  </style>

</head>


<body>

  <div id="map"></div>


  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
  </script>


  <script>

    let map = null;

    let sosMarker = null;

    let firstLocation = true;


    // =======================================================
    // CREATE MAP
    // =======================================================

    map = L.map(
      'map',
      {
        zoomControl: false
      }
    ).setView(

      [20.5937, 78.9629],

      5

    );


    // =======================================================
    // OPENSTREETMAP
    // =======================================================

    L.tileLayer(

      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      {

        maxZoom: 19,

        attribution:
          '&copy; OpenStreetMap contributors'

      }

    ).addTo(map);


    // =======================================================
    // ZOOM CONTROL
    // =======================================================

    L.control.zoom({

      position:
        'topright',

    }).addTo(map);


    // =======================================================
    // SCALE
    // =======================================================

    L.control.scale({

      position:
        'bottomleft',

      imperial:
        false,

      metric:
        true,

    }).addTo(map);


    // =======================================================
    // SOS ICON
    // =======================================================

    const sosIcon =
      L.divIcon({

        className:
          '',

        html:
          '<div class="sos-marker"></div>',

        iconSize:
          [22, 22],

        iconAnchor:
          [11, 11],

        popupAnchor:
          [0, -10],

      });


    // =======================================================
    // UPDATE SOS MARKER
    // =======================================================

    window.updateSOSMarker =
      function(
        latitude,
        longitude
      ) {

        if (!map) {
          return;
        }


        const position = [

          latitude,
          longitude

        ];


        // Create marker
        if (!sosMarker) {

          sosMarker =

            L.marker(

              position,

              {
                icon:
                  sosIcon,

                zIndexOffset:
                  1000,

              }

            )

              .addTo(map)

              .bindPopup(

                '<b>🚨 SOS Live Location</b><br/>' +

                latitude.toFixed(6) +

                ', ' +

                longitude.toFixed(6)

              );

        }


        // Move marker
        else {

          sosMarker.setLatLng(
            position
          );


          sosMarker.setPopupContent(

            '<b>🚨 SOS Live Location</b><br/>' +

            latitude.toFixed(6) +

            ', ' +

            longitude.toFixed(6)

          );

        }


        // First location
        if (firstLocation) {

          map.setView(

            position,

            17,

            {
              animate:
                true
            }

          );

          firstLocation =
            false;

        }

      };


    // =======================================================
    // RECENTER
    // =======================================================

    window.recenterMap =
      function() {

        if (
          !map ||
          !sosMarker
        ) {

          return;

        }


        const position =
          sosMarker.getLatLng();


        map.setView(

          position,

          Math.max(
            map.getZoom(),
            17
          ),

          {
            animate:
              true
          }

        );

      };


    // =======================================================
    // ZOOM IN
    // =======================================================

    window.zoomIn =
      function() {

        if (!map) {
          return;
        }

        map.zoomIn();

      };


    // =======================================================
    // ZOOM OUT
    // =======================================================

    window.zoomOut =
      function() {

        if (!map) {
          return;
        }

        map.zoomOut();

      };


    // =======================================================
    // MAP INTERACTION
    // =======================================================

    map.on(
      'dragstart',
      function() {

        window.ReactNativeWebView.postMessage(

          JSON.stringify({

            type:
              'MAP_MOVED',

          })

        );

      }

    );


    map.on(
      'zoomstart',
      function() {

        window.ReactNativeWebView.postMessage(

          JSON.stringify({

            type:
              'MAP_MOVED',

          })

        );

      }

    );


    // =======================================================
    // MAP READY
    // =======================================================

    window.ReactNativeWebView.postMessage(

      JSON.stringify({

        type:
          'MAP_READY'

      })

    );

  </script>

</body>

</html>

  `, []);


  // =========================================================
  // UPDATE MAP
  // =========================================================

  const updateMap = (
    latitude,
    longitude
  ) => {

    if (
      !webViewRef.current
    ) {

      return;

    }


    const script = `

      if (
        window.updateSOSMarker
      ) {

        window.updateSOSMarker(
          ${latitude},
          ${longitude}
        );

      }

      true;

    `;


    webViewRef.current.injectJavaScript(
      script
    );

  };


  // =========================================================
  // RECENTER MAP
  // =========================================================

  const recenterMap = () => {

    setIsFollowing(true);


    if (
      !webViewRef.current
    ) {

      return;

    }


    webViewRef.current.injectJavaScript(`

      if (
        window.recenterMap
      ) {

        window.recenterMap();

      }

      true;

    `);

  };


  // =========================================================
  // GET CURRENT DEVICE LOCATION
  // =========================================================

  useEffect(() => {

    let mounted = true;


    const getCurrentLocation =
      async () => {

        try {

          const permission =
            await Location
              .requestForegroundPermissionsAsync();


          if (
            permission.status !==
            'granted'
          ) {

            console.log(
              '❌ Location permission denied on map'
            );

            return;

          }


          const location =
            await Location
              .getCurrentPositionAsync({

                accuracy:
                  Location.Accuracy.High,

              });


          if (!mounted) {
            return;
          }


          const {
            latitude,
            longitude
          } =
            location.coords;


          setCurrentLocation({

            latitude,

            longitude,

          });

        } catch (error) {

          console.error(
            '❌ Map location error:',
            error
          );

        }

      };


    getCurrentLocation();


    return () => {

      mounted = false;

    };

  }, []);


  // =========================================================
  // SOCKET.IO LIVE LOCATION
  // =========================================================

  useEffect(() => {

    const handleReceiveLocation =
      (data) => {

        if (!data) {
          return;
        }


        const {
          emergencyId,
          latitude,
          longitude
        } =
          data;


        if (
          latitude === undefined ||
          longitude === undefined
        ) {

          return;

        }


        console.log(

          '🗺️ Map received location:',

          emergencyId,

          latitude,

          longitude

        );


        const newLocation = {

          latitude,

          longitude,

        };


        setCurrentLocation(
          newLocation
        );


        updateMap(
          latitude,
          longitude
        );

      };


    socket.on(

      'receiveLocation',

      handleReceiveLocation

    );


    return () => {

      socket.off(

        'receiveLocation',

        handleReceiveLocation

      );

    };

  }, []);


  // =========================================================
  // MAP EVENTS
  // =========================================================

  const handleWebViewMessage = (
    event
  ) => {

    try {

      const data =
        JSON.parse(

          event.nativeEvent.data

        );


      // -----------------------------------------------------
      // MAP READY
      // -----------------------------------------------------

      if (
        data.type ===
        'MAP_READY'
      ) {

        setLoading(false);


        if (
          currentLocation
        ) {

          updateMap(

            currentLocation.latitude,

            currentLocation.longitude

          );

        }


        return;

      }


      // -----------------------------------------------------
      // USER MOVED MAP
      // -----------------------------------------------------

      if (
        data.type ===
        'MAP_MOVED'
      ) {

        setIsFollowing(
          false
        );

      }

    } catch (error) {

      console.error(

        '❌ WebView message error:',

        error

      );

    }

  };


  // =========================================================
  // UI
  // =========================================================

  return (

    <View
      style={styles.container}
    >

      {/* ====================================================
          MAP
      ==================================================== */}

      <WebView

        ref={
          webViewRef
        }

        source={{
          html:
            mapHtml
        }}

        style={
          styles.map
        }

        originWhitelist={[
          '*'
        ]}

        javaScriptEnabled={
          true
        }

        domStorageEnabled={
          true
        }

        onMessage={
          handleWebViewMessage
        }

      />


      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading && (

        <View
          style={
            styles.loadingOverlay
          }
        >

          <ActivityIndicator

            size="large"

            color={
              COLORS.primary
            }

          />


          <Text
            style={
              styles.loadingText
            }
          >

            Loading map...

          </Text>

        </View>

      )}


      {/* ====================================================
          LIVE BADGE
      ==================================================== */}

      <View
        style={
          styles.liveBadge
        }
      >

        <View
          style={
            styles.liveDot
          }
        />


        <Text
          style={
            styles.liveText
          }
        >

          LIVE

        </Text>

      </View>


      {/* ====================================================
          MAP ACTIONS
      ==================================================== */}

      <View
        style={
          styles.mapActions
        }
      >

        {/* Recenter */}

        <TouchableOpacity

          style={[
            styles.mapButton,

            isFollowing &&
              styles.mapButtonActive,
          ]}

          onPress={
            recenterMap
          }

          activeOpacity={
            0.8
          }

        >

          <Text
            style={
              styles.mapButtonIcon
            }
          >

            ◎

          </Text>

        </TouchableOpacity>


        {/* Current location */}

        <TouchableOpacity

          style={
            styles.mapButton
          }

          onPress={
            recenterMap
          }

          activeOpacity={
            0.8
          }

        >

          <Text
            style={
              styles.mapButtonIcon
            }
          >

            📍

          </Text>

        </TouchableOpacity>

      </View>


      {/* ====================================================
          FOLLOW STATUS
      ==================================================== */}

      {!isFollowing && (

        <TouchableOpacity

          style={
            styles.followButton
          }

          onPress={
            recenterMap
          }

          activeOpacity={
            0.85
          }

        >

          <Text
            style={
              styles.followButtonText
            }
          >

            ◎ Recenter on SOS

          </Text>

        </TouchableOpacity>

      )}


      {/* ====================================================
          LOCATION CARD
      ==================================================== */}

      {currentLocation && (

        <View
          style={
            styles.locationCard
          }
        >

          <View
            style={
              styles.locationHeader
            }
          >

            <View>

              <Text
                style={
                  styles.locationTitle
                }
              >

                🚨 SOS Location

              </Text>


              <Text
                style={
                  styles.locationSubtitle
                }
              >

                Live coordinates

              </Text>

            </View>


            <View
              style={
                styles.liveSmallBadge
              }
            >

              <View
                style={
                  styles.smallDot
                }
              />

              <Text
                style={
                  styles.liveSmallText
                }
              >

                LIVE

              </Text>

            </View>

          </View>


          <Text
            style={
              styles.coordinates
            }
          >

            {currentLocation.latitude.toFixed(6)}

            {'  '}

            {currentLocation.longitude.toFixed(6)}

          </Text>

        </View>

      )}

    </View>

  );

}


// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        '#fff',

    },


    map: {

      flex: 1,

    },


    loadingOverlay: {

      position:
        'absolute',

      top:
        0,

      left:
        0,

      right:
        0,

      bottom:
        0,

      justifyContent:
        'center',

      alignItems:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.75)',

    },


    loadingText: {

      marginTop:
        10,

      fontSize:
        15,

      fontWeight:
        '600',

      color:
        COLORS.textPrimary,

    },


    liveBadge: {

      position:
        'absolute',

      top:
        20,

      right:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#fff',

      paddingVertical:
        9,

      paddingHorizontal:
        13,

      borderRadius:
        20,

      elevation:
        6,

      shadowColor:
        '#000',

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      shadowOpacity:
        0.15,

      shadowRadius:
        6,

    },


    liveDot: {

      width:
        9,

      height:
        9,

      borderRadius:
        5,

      backgroundColor:
        '#22C55E',

      marginRight:
        7,

    },


    liveText: {

      fontSize:
        11,

      fontWeight:
        '800',

      color:
        '#166534',

      letterSpacing:
        0.5,

    },


    mapActions: {

      position:
        'absolute',

      top:
        80,

      right:
        15,

      gap:
        10,

    },


    mapButton: {

      width:
        48,

      height:
        48,

      borderRadius:
        14,

      backgroundColor:
        '#fff',

      justifyContent:
        'center',

      alignItems:
        'center',

      elevation:
        6,

      shadowColor:
        '#000',

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      shadowOpacity:
        0.18,

      shadowRadius:
        6,

    },


    mapButtonActive: {

      borderWidth:
        2,

      borderColor:
        COLORS.primary,

    },


    mapButtonIcon: {

      fontSize:
        24,

    },


    followButton: {

      position:
        'absolute',

      top:
        80,

      left:
        '50%',

      transform: [

        {
          translateX:
            -72
        }

      ],

      backgroundColor:
        '#fff',

      paddingVertical:
        10,

      paddingHorizontal:
        15,

      borderRadius:
        22,

      elevation:
        6,

      shadowColor:
        '#000',

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      shadowOpacity:
        0.18,

      shadowRadius:
        6,

    },


    followButtonText: {

      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.primary,

    },


    locationCard: {

      position:
        'absolute',

      bottom:
        20,

      left:
        15,

      right:
        15,

      backgroundColor:
        '#fff',

      padding:
        15,

      borderRadius:
        16,

      elevation:
        7,

      shadowColor:
        '#000',

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      shadowOpacity:
        0.18,

      shadowRadius:
        7,

    },


    locationHeader: {

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginBottom:
        8,

    },


    locationTitle: {

      fontSize:
        15,

      fontWeight:
        '800',

      color:
        COLORS.textPrimary,

    },


    locationSubtitle: {

      marginTop:
        2,

      fontSize:
        11,

      color:
        COLORS.textSecondary,

    },


    liveSmallBadge: {

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#DCFCE7',

      paddingVertical:
        5,

      paddingHorizontal:
        8,

      borderRadius:
        12,

    },


    smallDot: {

      width:
        7,

      height:
        7,

      borderRadius:
        4,

      backgroundColor:
        '#16A34A',

      marginRight:
        5,

    },


    liveSmallText: {

      fontSize:
        9,

      fontWeight:
        '800',

      color:
        '#166534',

    },


    coordinates: {

      fontSize:
        14,

      fontWeight:
        '600',

      color:
        COLORS.textSecondary,

      letterSpacing:
        0.3,

    },

  }); 