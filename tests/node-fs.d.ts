declare module "node:fs" {
  export function existsSync(path: string | URL): boolean;
}
