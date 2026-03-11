import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export function useLiveResults(electionId, namespace = '/admin', token = null) {
  const [results, setResults] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!electionId) return;

    const socket = io(namespace, {
      auth: token ? { token } : {},
      path: '/socket.io',
    });

    socket.on('connect', () => {
      socket.emit('join:election', parseInt(electionId));
    });

    socket.on('vote:update', (data) => {
      setResults(data);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave:election', parseInt(electionId));
      socket.disconnect();
    };
  }, [electionId, namespace, token]);

  return results;
}
