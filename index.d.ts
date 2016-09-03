// custom interfaces

interface Options {
  print: boolean
}

interface Chapter {
  level: number;
  order: number;
  title: string;
  id: string;
  href?: string;
}

interface Metadata {
  creator: string,
  creatorFileAs: string,
  title: string,
  language: string,
  subject: string,
  date: string,
  description: string
}

declare module "promisify-event" {
  function promisify(server, event: string): Promise<void>;
  export = promisify;
}
