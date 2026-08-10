import { useState, useEffect } from 'react';
import { greenroomStore } from '../stores/greenroomStore';

export function useGreenroomState() {
  const [state, setState] = useState(() => greenroomStore.getState());

  useEffect(() => {
    const unsubscribe = greenroomStore.subscribe((newState) => {
      setState({ ...newState });
    });
    return unsubscribe;
  }, []);

  return state;
}
