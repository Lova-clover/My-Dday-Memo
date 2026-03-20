import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isMobileRequest } from "../lib/is-mobile-request";

export default async function Home() {
  const headerStore = await headers();

  if (isMobileRequest(headerStore)) {
    redirect("/dday-v3.html");
  }

  redirect("/web");
}
