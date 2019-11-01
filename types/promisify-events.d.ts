declare function PromisifyEvent(server: any, event: string): Promise<void>

declare module 'promisify-event' {
  export = PromisifyEvent
}
