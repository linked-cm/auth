// Make a provider serve one HTTP call, the way LinkedServer does, for tests that call providers
// directly instead of over HTTP.
//
// Since @_linked/server-utils 1.9, `provider.request` and `provider.response` are read from the
// per-call context the server opens for every HTTP request (utils/CallContext), and assigning
// them outside a call is ignored. So every access to the returned provider (method calls, and
// `provider.request` read by Auth's static helpers) runs inside the http context of `request`.
// Older server-utils has no CallContext and reads plain fields instead.

// absent before @_linked/server-utils 1.9
const callContext = await import('@_linked/server-utils/utils/CallContext').catch(() => null);

/**
 * `provider`, serving the call `request` (with `request.res` as its response).
 * Use the returned object in place of `provider`.
 */
export function serving(provider, request) {
  if (!callContext) {
    provider.request = request;
    provider.response = request.res;
    return provider;
  }
  const inCall = (fn) => callContext.runInHttpContext(request, request.res, fn);
  return new Proxy(provider, {
    get(target, prop) {
      const value = inCall(() => Reflect.get(target, prop, target));
      return typeof value === 'function'
        ? (...args) => inCall(() => value.apply(target, args))
        : value;
    },
    set(target, prop, value) {
      return inCall(() => Reflect.set(target, prop, value, target));
    },
  });
}
