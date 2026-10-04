import * as Location from 'expo-location';
import { sendLocation } from './socket';

let locationSubscription = null;
let activeEmergencyId = null;


// =========================================================
// START EMERGENCY LOCATION TRACKING
// =========================================================

export const startEmergencyLocationTracking = async (
  emergencyId
) => {

  if (!emergencyId) {
    throw new Error(
      'Emergency ID is required'
    );
  }


  // Already tracking this emergency
  if (
    locationSubscription &&
    activeEmergencyId === emergencyId
  ) {

    console.log(
      `⚠️ Already tracking Emergency ${emergencyId}`
    );

    return;
  }


  // Stop any previous tracker
  stopEmergencyLocationTracking();


  try {

    // Check permission
    let { status } =
      await Location.getForegroundPermissionsAsync();


    // Request permission when needed
    if (status !== 'granted') {

      const permission =
        await Location.requestForegroundPermissionsAsync();

      status = permission.status;

    }


    if (status !== 'granted') {

      throw new Error(
        'Location permission denied'
      );

    }


    activeEmergencyId =
      emergencyId;


    console.log(
      `📍 Starting independent GPS tracking for Emergency ${emergencyId}`
    );


    locationSubscription =
      await Location.watchPositionAsync(

        {
          accuracy:
            Location.Accuracy.High,

          timeInterval:
            1000,

          distanceInterval:
            0,
        },


        (location) => {

          const {
            latitude,
            longitude
          } = location.coords;


          console.log(
            '📍 GPS update:',
            latitude,
            longitude
          );


          sendLocation({

            emergencyId:
              activeEmergencyId,

            latitude,

            longitude,

          });


          console.log(
            '📡 SOS location sent'
          );

        }

      );


    console.log(
      `✅ Independent GPS tracking active for Emergency ${emergencyId}`
    );


  } catch (error) {

    activeEmergencyId = null;

    console.error(
      '❌ Location tracking error:',
      error.message
    );

    throw error;
  }

};


// =========================================================
// STOP EMERGENCY LOCATION TRACKING
// =========================================================

export const stopEmergencyLocationTracking = () => {

  if (locationSubscription) {

    locationSubscription.remove();

    locationSubscription = null;

  }


  if (activeEmergencyId) {

    console.log(
      `🛑 GPS tracking stopped for Emergency ${activeEmergencyId}`
    );

  }


  activeEmergencyId = null;

};


// =========================================================
// GET ACTIVE EMERGENCY ID
// =========================================================

export const getActiveEmergencyId = () => {
  return activeEmergencyId;
};