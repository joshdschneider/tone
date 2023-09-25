import { EventEmitter } from 'stream';
import { AgentState, GenerationType } from '../types';
import { RECOVERY_MESSAGE } from '../utils/constants';
import { log } from '../utils/log';

export type AgentConstructor = {
  id: string;
  prompt: string;
  greeting: string;
  voicemail?: string;
  functions?: string;
};

export class Agent extends EventEmitter {
  public state: AgentState;
  private id: string;
  private prompt: string;
  public greeting: string;
  private voicemail?: string;
  private functions?: string;

  constructor({ id, prompt, greeting, voicemail, functions }: AgentConstructor) {
    super();
    this.state = AgentState.IDLE;
    this.id = id;
    this.prompt = prompt;
    this.greeting = greeting;
    this.voicemail = voicemail;
    this.functions = functions;
  }

  public setState(state: AgentState): void {
    if (this.state !== state) {
      log(`Updating state: ${this.state} => ${state}`);
      this.state = state;
    }
  }

  public generate(type?: GenerationType) {
    switch (type) {
      case GenerationType.GREETING:
        this.emit('text', this.greeting);
        return;
      case GenerationType.RECOVERY:
        this.emit('text', RECOVERY_MESSAGE);
        return;
      default:
      // generate
    }
  }

  public cancel() {
    //..
  }

  public destroy() {
    //..
  }
}
