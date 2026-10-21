import Hero from '../components/Hero';
import HotelSearch from '../components/HotelSearch';
import TrustStrip from '../components/TrustStrip';
import HotelCollection from '../components/HotelCollection';
import BrandBenefits from '../components/BrandBenefits';
import StayYourWay from '../components/StayYourWay';
import DestinationFeature from '../components/DestinationFeature';
import HotelOwnerCTA from '../components/HotelOwnerCTA';
import FAQ from '../components/FAQ';

export default function Home() {
  return (
    <>
      <Hero />
      <HotelSearch />
      <TrustStrip />
      <HotelCollection />
      <BrandBenefits />
      <StayYourWay />
      <DestinationFeature />
      <HotelOwnerCTA />
      <FAQ />
    </>
  );
}
