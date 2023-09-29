import { AgentState, CallEvent } from '../types';

export type StateMachineConstructor = {
  setState: (state: AgentState) => void;
  hasGreeting: boolean;
  greet: () => void;
  respond: () => void;
  abort: () => void;
};

export class StateMachine {
  private setState;
  private hasGreeting;
  private greet;
  private respond;
  private abort;

  constructor({ setState, hasGreeting, greet, respond, abort }: StateMachineConstructor) {
    this.setState = setState;
    this.hasGreeting = hasGreeting;
    this.greet = greet;
    this.respond = respond;
    this.abort = abort;
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

          case CallEvent.GREETING_ENDED:
          case CallEvent.RESPONSE_ENDED:
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

          case CallEvent.GREETING_ENDED:
          case CallEvent.RESPONSE_ENDED:
            this.setState(AgentState.LISTENING);
            return;

          default:
            throw new Error(`Unhandled event ${event} in state ${AgentState.SPEAKING}`);
        }

      default:
        throw new Error(`Unhandled state ${currentState}`);
    }
  }
}
