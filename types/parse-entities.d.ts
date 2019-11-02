// export = PromisifyEvent

declare function ParseEntities(input: string): string

declare module 'parse-entities' {
  export = ParseEntities
}
