import * as is from 'is-type-of';

export default class Exception extends Error {
  private _code: number;
  private _status: number;
  private _message: string;
  private _error?: string;

  constructor({ code, msg, error, status = 200 }: { code: number; msg: string; error?: string; status?: number }) {
    super(msg);
    this._code = code;
    this._message = msg;
    this._error = error;
    this._status = status;
  }
  get code(): number {
    return this._code;
  }

  get error(): string {
    return this._error || this._message;
  }

  get message(): string {
    return this._message;
  }

  get status(): number {
    return this._status;
  }

  toString() {
    const message = this.getErrorString(this.message);
    return `Error: ${message}`;
  }

  getErrorString(target) {
    return is.string(target) ? target : JSON.stringify(target);
  }
}
