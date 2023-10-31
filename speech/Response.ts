import { Generator, Split } from '../generator/Generator';
import { createGenerator } from '../generator/createGenerator';
import ActionService from '../services/ActionService';
import { ActionFunction, FunctionCall, Message, Role, TextChunk } from '../types';
import { DEFAULT_ERROR_MESSAGE } from '../utils/constants';
import { LogLevel, log } from '../utils/log';
import { now } from '../utils/now';
import { Speech, SpeechConstructor } from './Speech';

export type ResponseConstructor = {
  callId: string;
  messages: Message[];
  prompt?: string;
  functions?: ActionFunction[];
  temperature?: number;
  split?: Split;
  pregenerated?: boolean;
} & SpeechConstructor;

export class Response extends Speech {
  private callId: string;
  private generator?: Generator;
  private messages: Message[];
  private prompt?: string;
  private functions?: ActionFunction[];
  private temperature?: number;
  private split?: Split;

  constructor({
    callId,
    messages,
    prompt,
    functions,
    temperature,
    split,
    voiceProvider,
    voiceOptions,
    pregenerated,
  }: ResponseConstructor) {
    super({ voiceProvider, voiceOptions });
    this.callId = callId;
    this.messages = messages;
    this.prompt = prompt;
    this.functions = functions;
    this.temperature = temperature;
    this.split = split;
    this.pregenerated = pregenerated;
    this.generate();
  }

  private generate() {
    this.generator = createGenerator({
      messages: this.messages,
      prompt: this.prompt,
      functions: this.functions,
      temperature: this.temperature,
      split: this.split,
    });

    this.generator.on('text', (chunk: TextChunk) => this.handleTextChunk(chunk));
    this.generator.on('function_call', (func: FunctionCall) => this.handleFunctionCall(func));
    this.generator.on('done', () => this.handleGeneratorDone());
    this.generator.on('error', (err: any) => this.handleGeneratorError(err));
    this.generator.generate();
  }

  private handleTextChunk(textChunk: TextChunk) {
    this.synthesize(textChunk);
  }

  private async handleFunctionCall(func: FunctionCall) {
    log(`Function called: ${JSON.stringify(func)}`);
    const actionFunction = this.functions?.find((f) => f.name === func.name);
    if (actionFunction) {
      this.executeFunction(actionFunction, func.args);
    } else {
      log(`Function not found: ${JSON.stringify(func)}`, LogLevel.ERROR);
    }
  }

  private executeFunction(func: ActionFunction, args: any) {
    log(`Executing function: ${func.name}`);
    if (func.name === 'end_call') {
      this.cleanup();
      this.pushFunctionCallMessage(func.name, args);
      this.pushFunctionResponseMessage(func.name, { success: true });
      this.generate();
      this.endCallOnDone = true;
    } else if (func.name === 'hold_call') {
      this.cleanup();
      this.pushFunctionCallMessage(func.name, args);
      this.pushFunctionResponseMessage(func.name, { success: true });
      this.emit('hold');
      this.generate();
    } else if (func.name.startsWith('transfer_call')) {
      this.cleanup();
      this.pushFunctionCallMessage(func.name, args);
      this.pushFunctionResponseMessage(func.name, { success: true });
      this.generate();
      this.transferCallOnDone = true;
      this.transferCallPayload = {
        actionId: func.action_id,
        callId: this.callId,
        args,
      };
    } else {
      this.cleanup();
      ActionService.execute(func.action_id, this.callId, args)
        .then((res) => {
          if (res.success) {
            this.pushFunctionCallMessage(func.name, args);
            this.pushFunctionResponseMessage(func.name, res.data);
            this.generate();
          } else {
            throw new Error(DEFAULT_ERROR_MESSAGE);
          }
        })
        .catch((err) => {
          log('Action error', LogLevel.ERROR);
          this.emit('error', err);
        });
    }
  }

  private pushFunctionCallMessage(name: string, args: any) {
    const functionCallMessage: Message = {
      role: Role.ASSISTANT,
      content: null,
      function_call: {
        name,
        arguments: JSON.stringify(args),
      },
      start: now(),
      end: now(),
    };

    this.messages.push(functionCallMessage);
  }

  private pushFunctionResponseMessage(name: string, content: any) {
    const functionResponseMessage = {
      role: Role.FUNCTION,
      name: name,
      content: JSON.stringify({ success: true }),
      start: now(),
      end: now(),
    };

    this.messages.push(functionResponseMessage);
  }

  private handleGeneratorDone() {
    log('Generator done');
    if (this.generator) {
      this.generator.destroy();
      this.generator = undefined;
    }
  }

  private handleGeneratorError(err: any) {
    log('Generator error', LogLevel.ERROR);
    this.emit('error', err);
  }

  private cleanup() {
    log(`Cleaning up generator`);
    if (this.generator) {
      this.generator.destroy();
      this.generator = undefined;
    }
  }

  public destroy(): void {
    log(`Destroying response`);
    if (this.generator) {
      this.generator.destroy();
      this.generator = undefined;
    }

    super.destroy();
  }
}
