// custom interfaces

// top level options for how the module is run
interface Options {
  print?: boolean,
  fragile?: boolean
}

declare module "promisify-event" {
  function promisify(server, event: string): Promise<void>;
  export = promisify;
}
