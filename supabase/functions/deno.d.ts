// Minimalne typy Deno do sprawdzania funkcji poleceniem `npm run typecheck:functions`
// (na komputerze bez Deno). W Supabase funkcje działają na prawdziwym Deno.
declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
  env: { get(name: string): string | undefined };
};
