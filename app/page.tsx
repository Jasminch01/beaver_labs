import Home from "@/components/home";

async function getYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function Page() {
  const year = await getYear();
  return <Home year={year} />;
}
