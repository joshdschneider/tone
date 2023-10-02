import { AgentState, CallEvent } from '../types';

export type StateMachineConstructor = {
  setState: (state: AgentState) => void;
  hasGreeting: boolean;
  greet: () => void;
  respond: () => void;
  cleanup: () => void;
  abort: () => void;
  recover: () => void;
};

export class StateMachine {
  private setState: (state: AgentState) => void;
  private hasGreeting: boolean;
  private greet: () => void;
  private respond: () => void;
  private cleanup: () => void;
  private abort: () => void;
  private recover: () => void;

  constructor({
    setState,
    hasGreeting,
    greet,
    respond,
    cleanup,
    abort,
    recover,
  }: StateMachineConstructor) {
    this.setState = setState;
    this.hasGreeting = hasGreeting;
    this.greet = greet;
    this.respond = respond;
    this.cleanup = cleanup;
    this.abort = abort;
    this.recover = recover;
  }

  public transition(currentState: AgentState, event: CallEvent) {
    switch (currentState) {
      case AgentState.IDLE:
        switch (event) {
          case CallEvent.CALL_CONNECTED_INBOUND:
            this.setState(AgentState.SPEAKING);
            this.greet();
            return;

          case CallEvent.CALL_CONNECTED_OUTBOUND:
            if (!this.hasGreeting) {
              this.setState(AgentState.LISTENING);
            }
            return;

          case CallEvent.TRANSCRIPT_PARTIAL:
          case CallEvent.TRANSCRIPT_FULL:
            return;

          case CallEvent.TRANSCRIPT_ENDPOINT:
            this.setState(AgentState.SPEAKING);
            this.greet();
            return;

          default:
            throw new Error(`Unhandled event ${event} in state ${AgentState.IDLE}`);
        }

      case AgentState.LISTENING:
        switch (event) {
          case CallEvent.TRANSCRIPT_PARTIAL:
            return;

          case CallEvent.TRANSCRIPT_FULL:
          case CallEvent.TRANSCRIPT_ENDPOINT:
            this.setState(AgentState.SPEAKING);
            this.respond();
            return;

          default:
            throw new Error(`Unhandled event ${event} in state ${AgentState.LISTENING}`);
        }

      case AgentState.SPEAKING:
        switch (event) {
          case CallEvent.TRANSCRIPT_PARTIAL:
            this.abort();
            this.setState(AgentState.LISTENING);
            return;

          case CallEvent.TRANSCRIPT_FULL:
          case CallEvent.TRANSCRIPT_ENDPOINT:
            this.abort();
            this.setState(AgentState.SPEAKING);
            this.respond();
            return;

          case CallEvent.SPEECH_ENDED:
            this.cleanup();
            this.setState(AgentState.LISTENING);
            return;

          case CallEvent.SPEECH_ERROR:
            this.abort();
            this.setState(AgentState.SPEAKING);
            this.recover();

          default:
            throw new Error(`Unhandled event ${event} in state ${AgentState.SPEAKING}`);
        }

      default:
        throw new Error(`Unhandled state ${currentState}`);
    }
  }
}
