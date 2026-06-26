import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parse, type UrlWithParsedQuery } from "node:url";

export type NextRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  parsedUrl?: UrlWithParsedQuery,
) => void | Promise<void>;

/** Bridge a Web `Request` through Next.js `getRequestHandler` (for Bun.serve). */
export async function fetchViaNextHandler(
  req: Request,
  handle: NextRequestHandler,
): Promise<Response> {
  const url = new URL(req.url);
  const parsedUrl = parse(`${url.pathname}${url.search}`, true) as UrlWithParsedQuery;

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const { createRequestResponseMocks } = await import(
    "next/dist/server/lib/mock-request"
  );

  let bodyReadable: Readable | undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    const buf = Buffer.from(await req.arrayBuffer());
    bodyReadable = buf.length > 0 ? Readable.from(buf) : undefined;
  }

  const { req: nodeReq, res: nodeRes } = createRequestResponseMocks({
    url: `${url.pathname}${url.search}`,
    headers,
    method: req.method,
    bodyReadable,
  });

  await new Promise<void>((resolve, reject) => {
    nodeRes.on("finish", resolve);
    nodeRes.on("error", reject);
    Promise.resolve(handle(nodeReq, nodeRes, parsedUrl)).catch(reject);
  });

  const mockedRes = nodeRes as unknown as {
    buffers: Buffer[];
    statusCode: number;
    headers: Headers;
  };
  const body = Buffer.concat(mockedRes.buffers);
  return new Response(body.byteLength > 0 ? body : null, {
    status: mockedRes.statusCode,
    headers: mockedRes.headers,
  });
}
