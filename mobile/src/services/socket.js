import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('❌ No auth token available for Socket.IO');
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};


// =========================================================
// JOIN EMERGENCY ROOM
// =========================================================

export const joinEmergency = (emergencyId) => {
  return new Promise((resolve, reject) => {

    if (!emergencyId) {
      reject(
        new Error('Emergency ID is required')
      );
      return;
    }

    let connectHandler = null;
    let timeout = null;

    const cleanup = () => {

      socket.off(
        'emergencyJoined',
        handleJoined
      );

      socket.off(
        'emergencyAccessDenied',
        handleDenied
      );

      if (connectHandler) {
        socket.off(
          'connect',
          connectHandler
        );
      }

      if (timeout) {
        clearTimeout(timeout);
      }
    };


    const handleJoined = (data) => {

      if (
        data?.emergencyId !== emergencyId
      ) {
        return;
      }

      cleanup();

      console.log(
        `✅ Successfully joined emergency room: ${emergencyId}`
      );

      resolve(true);
    };


    const handleDenied = (data) => {

      if (
        data?.emergencyId &&
        data.emergencyId !== emergencyId
      ) {
        return;
      }

      cleanup();

      reject(
        new Error(
          'Emergency room access denied'
        )
      );
    };


    const emitJoin = () => {

      socket.emit(
        'joinEmergency',
        emergencyId
      );

    };


    socket.on(
      'emergencyJoined',
      handleJoined
    );

    socket.on(
      'emergencyAccessDenied',
      handleDenied
    );


    if (socket.connected) {

      emitJoin();

    } else {

      connectHandler = () => {
        emitJoin();
      };

      socket.once(
        'connect',
        connectHandler
      );
    }


    timeout = setTimeout(() => {

      cleanup();

      reject(
        new Error(
          'Emergency room join timed out'
        )
      );

    }, 5000);

  });
};


// =========================================================
// SEND LOCATION
// =========================================================

export const sendLocation = (data) => {

  if (socket.connected) {

    socket.emit(
      'sendLocation',
      data
    );

  }

};


// =========================================================
// SOCKET EVENTS
// =========================================================

socket.on(
  'connect',
  () => {

    console.log(
      '✅ Authenticated socket connected:',
      socket.id
    );

  }
);


socket.on(
  'connect_error',
  (error) => {

    console.log(
      '❌ Socket auth error:',
      error.message
    );

  }
);