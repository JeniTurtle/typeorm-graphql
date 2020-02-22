type Diff<T extends keyof any, U extends keyof any> = 
({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

type Overwrite<T, U> = Pick<T, Diff<keyof T, keyof U>> & U;

interface IRequest {
  query: PlainObject<string | number>;
}

declare module 'egg' {
  interface Context {
    request: Overwrite<Request, IRequest>;
  }

  interface Application {
    jwt: any;
    exception: any;
    eureka: IForgedEureka;
  }

  interface Agent {
    eureka: any;
    sentry: any
  }
}
