const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone/i;

export function isMobileRequest(headerStore) {
  const userAgent = headerStore.get("user-agent") ?? "";
  const chMobile = headerStore.get("sec-ch-ua-mobile") ?? "";

  return MOBILE_UA.test(userAgent) || chMobile.includes("?1");
}
