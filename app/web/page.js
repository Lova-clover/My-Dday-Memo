import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DuckMemoWeb from "../../components/duck-memo-web";
import { isMobileRequest } from "../../lib/is-mobile-request";

export const metadata = {
  title: "웹 보드",
};

export default async function WebPage() {
  const headerStore = await headers();

  if (isMobileRequest(headerStore)) {
    redirect("/dday-v3.html");
  }

  return <DuckMemoWeb />;
}
