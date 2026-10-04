import { io } from 'socket.io-client';
import { API_URL } from '../utils/constants';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const sendLocation = (data) => {
  if (socket.connected) {
    socket.emit('sendLocation', data);
  }
};