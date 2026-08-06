// utils/mockApi.js

export const IS_LOCAL =
  import.meta.env.DEV &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");