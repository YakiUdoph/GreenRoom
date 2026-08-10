import { useEffect } from 'react';
import { GreenroomWebSocketClient } from '../lib/websocket';
import { greenroomStore } from '../stores/greenroomStore';

export function useGreenroomSocket() {
  useEffect(() => {
    const wsClient = new GreenroomWebSocketClient({
      onStatusChange: (status) => {
        greenroomStore.setWsConnected(status === 'CONNECTED');
      },
      onMessage: (data) => {
        if (data.minds_status) {
          greenroomStore.setMindsStatus(data.minds_status);
        }
        if (data.memory_state) {
          greenroomStore.setMemoryState(data.memory_state);
        }

        if (data.type === 'INITIAL_SNAPSHOT') {
          if (data.imp_history) {
            greenroomStore.setImpHistory(data.imp_history);
          }
        } else if (data.type === 'IMP_MESSAGE') {
          if (data.data) {
            greenroomStore.addImpMessage(data.data);
          }
        }
      },
    });

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);
}
