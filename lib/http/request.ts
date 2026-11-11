/** Parse search params. Call outside try/catch so Cache Components bailout is not swallowed. */
export function getSearchParams(request: Request) {
  return new URL(request.url).searchParams;
}
