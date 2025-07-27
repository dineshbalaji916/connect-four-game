import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

// Use import.meta.env for Vite environment variables
const SOCKET_SERVER_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:4000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // Prioritize websockets for low latency
      reconnectionAttempts: 5, // Attempt to reconnect 5 times
      reconnectionDelay: 1000, // Wait 1 second before first reconnection attempt
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setError(null); // Clear any previous errors on successful connect
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
      // You might want to set an error if disconnection is unexpected (e.g., 'io server disconnect')
      if (reason === 'io server disconnect') {
        setError('Disconnected from server. Please refresh.');
      }
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setError('Could not connect to the game server. Please ensure the backend is running.');
        setIsConnected(false);
    });

    socketRef.current.on('error', (data) => { // Generic error event from server
        console.error('Server emitted error:', data.message);
        setError(data.message); // Display server-side error messages
    });

    // Cleanup function: disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected on cleanup');
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Memoized emit function
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Attempted to emit '${event}' but socket is not connected.`);
      // Optionally set an error state here if attempting to emit while disconnected
      setError('Cannot send message: Not connected to server.');
    }
  }, [isConnected]);

  // Memoized on function
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Memoized off function
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return { socket: socketRef.current, isConnected, error, emit, on, off };
};