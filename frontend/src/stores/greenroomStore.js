import { INITIAL_CREATOR_STATE, PIPELINE_STEP_TITLES, PIPELINE_STEP_DESCRIPTIONS } from '../lib/constants';

class GreenroomStore {
  constructor() {
    this.listeners = new Set();
    this.state = {
      wsConnected: false,
      mindsStatus: { mode: 'unconfigured', connected: false, is_mock: false },
      memoryState: INITIAL_CREATOR_STATE,
      impMessages: [],
      selectedPayload: null,
      isModalOpen: false,
      demoProgress: {
        activeStep: 0,
        isRunning: false,
        stepTitle: '',
        stepDesc: '',
      },
      activeCards: {
        pitch: null,
        script: null,
      },
      signals: [],
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

  setWsConnected(connected) {
    this.state = { ...this.state, wsConnected: connected };
    this.notify();
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

  setSignals(signals) {
    if (!Array.isArray(signals)) return;
    this.state = { ...this.state, signals };
    this.notify();
  }

  setImpHistory(messages) {
    const impMessages = Array.isArray(messages) ? messages : [];
    this.state = { ...this.state, impMessages };
    this.updateActiveCards();
    this.notify();
  }

  addImpMessage(message) {
    if (!message) return;
    const exists = this.state.impMessages.some((m) => m.message_id === message.message_id);
    if (exists) return;
    
    const impMessages = [...this.state.impMessages, message];
    this.state = { ...this.state, impMessages };
    this.updateActiveCards();
    this.notify();
  }

  updateActiveCards() {
    const messages = this.state.impMessages.slice().reverse();
    const stratMsg = messages.find((m) => m.action_type === 'DELEGATE_DRAFT');
    const pitchMsg = messages.find((m) => m.action_type === 'PITCH_PROPOSAL');

    this.state.activeCards = {
      script: stratMsg ? stratMsg.payload : null,
      pitch: pitchMsg ? pitchMsg.payload : null,
    };
  }

  setDemoProgress(stepId, isRunning = true) {
    this.state.demoProgress = {
      activeStep: stepId,
      isRunning,
      stepTitle: PIPELINE_STEP_TITLES[stepId] || `Executing Step ${stepId}...`,
      stepDesc: PIPELINE_STEP_DESCRIPTIONS[stepId] || '',
    };
    this.notify();
  }

  clearDemoProgress() {
    this.state.demoProgress = {
      activeStep: 0,
      isRunning: false,
      stepTitle: '',
      stepDesc: '',
    };
    this.notify();
  }

  openPayloadModal(message) {
    this.state.selectedPayload = message;
    this.state.isModalOpen = true;
    this.notify();
  }

  closePayloadModal() {
    this.state.selectedPayload = null;
    this.state.isModalOpen = false;
    this.notify();
  }

  resetStoreState(newMemoryState = INITIAL_CREATOR_STATE) {
    this.state = {
      ...this.state,
      memoryState: newMemoryState,
      impMessages: [],
      activeCards: { pitch: null, script: null },
      demoProgress: { activeStep: 0, isRunning: false, stepTitle: '', stepDesc: '' },
    };
    this.notify();
  }
}

export const greenroomStore = new GreenroomStore();
