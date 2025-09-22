import Image from "next/image";
import Banner from "./components/Banner/Banner";
import Varified_renter from "./components/Varified_renter/Varified_renter";
import Ai_tools from "./components/Ai_tools/Ai_tools";
import Cta from "./components/Cta/Cta";

export default function Home() {
  return (
   <div>
    <Banner />
    <Varified_renter />
    <Ai_tools/>
    <Cta />
   </div>
  );
}
