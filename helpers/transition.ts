import { AgentState, Event, GenerationType, QueueEvent, Transcript } from '../types';

export type TransitionProps = {
  currentState: AgentState;
  queueEvent: QueueEvent;
  greeting?: string;
  setState: (state: AgentState) => void;
  generate: (type?: GenerationType) => void;
  cancelGeneration: () => void;
  cancelSynthesis: () => void;
  appendTranscript: (transcript: Transcript) => void;
};

export function transition({ currentState, queueEvent, greeting, ...actions }: TransitionProps) {
  const { event, payload } = queueEvent;
  switch (currentState) {
    case AgentState.IDLE:
      switch (event) {
        case Event.CALL_CONNECTED_INBOUND:
          actions.setState(AgentState.PROCESSING);
          actions.generate(GenerationType.GREETING);
          return;

        case Event.CALL_CONNECTED_OUTBOUND:
          if (!greeting) {
            actions.setState(AgentState.PROCESSING);
          }
          return;

        case Event.TRANSCRIPT_PARTIAL:
          return;

        case Event.TRANSCRIPT_FULL:
          actions.appendTranscript(payload.transcript);
          return;

        case Event.TRANSCRIPT_ENDPOINT:
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.PROCESSING);
          actions.generate(GenerationType.GREETING);
          return;

        default:
          console.error(`Unhandled event ${event} in state ${currentState}`);
          return;
      }

    case AgentState.LISTENING:
      switch (event) {
        case Event.TRANSCRIPT_PARTIAL:
          return;

        case Event.TRANSCRIPT_FULL:
          actions.appendTranscript(payload.transcript);
          return;

        case Event.TRANSCRIPT_ENDPOINT:
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.PROCESSING);
          actions.generate();
          return;

        default:
          console.error(`Unhandled event ${event} in state ${currentState}`);
          return;
      }

    case AgentState.PROCESSING:
      switch (event) {
        case Event.TRANSCRIPT_PARTIAL:
          actions.cancelGeneration();
          actions.setState(AgentState.LISTENING);
          return;

        case Event.TRANSCRIPT_FULL:
          actions.cancelGeneration();
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.LISTENING);
          return;

        case Event.TRANSCRIPT_ENDPOINT:
          actions.cancelGeneration();
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.PROCESSING);
          actions.generate();
          return;

        case Event.SYNTHESIS_STARTED:
          actions.setState(AgentState.SPEAKING);
          return;

        case Event.GENERATION_ERROR:
          actions.cancelGeneration();
          return;

        default:
          console.error(`Unhandled event ${event} in state ${currentState}`);
          return;
      }

    case AgentState.SPEAKING:
      switch (event) {
        case Event.TRANSCRIPT_PARTIAL:
          actions.cancelGeneration();
          actions.cancelSynthesis();
          actions.setState(AgentState.LISTENING);
          return;

        case Event.TRANSCRIPT_FULL:
          actions.cancelGeneration();
          actions.cancelSynthesis();
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.LISTENING);
          return;

        case Event.TRANSCRIPT_ENDPOINT:
          actions.cancelGeneration();
          actions.cancelSynthesis();
          actions.appendTranscript(payload.transcript);
          actions.setState(AgentState.PROCESSING);
          actions.generate();
          return;

        case Event.SYNTHESIS_ENDED:
          actions.setState(AgentState.LISTENING);
          return;

        case Event.GENERATION_ERROR:
          actions.cancelGeneration();
          actions.cancelSynthesis();
          actions.setState(AgentState.PROCESSING);
          actions.generate(GenerationType.RECOVERY);
          return;

        case Event.SYNTHESIS_ERROR:
          actions.cancelGeneration();
          actions.cancelSynthesis();
          actions.setState(AgentState.PROCESSING);
          actions.generate(GenerationType.RECOVERY);
          return;

        default:
          console.error(`Unhandled event ${event} in state ${currentState}`);
          return;
      }
  }
}
