import { INITIAL_CREATOR_STATE } from '../lib/constants';

class GreenroomStore {
  constructor() {
    this.listeners = new Set();
    this.state = {
      mindsStatus: { mode: 'unconfigured', connected: false, is_mock: false },
      memoryState: INITIAL_CREATOR_STATE,
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }

  setMindsStatus(status) {
    if (!status) return;
    this.state = { ...this.state, mindsStatus: status };
    this.notify();
  }

  setMemoryState(memoryState) {
    if (!memoryState) return;
    this.state = { ...this.state, memoryState };
    this.notify();
  }

}

export const greenroomStore = new GreenroomStore();
