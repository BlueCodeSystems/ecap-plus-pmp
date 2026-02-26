import LoginCard from "@/components/LoginCard";
import VersionFooter from "@/components/VersionFooter";
import AuroraBackground from "@/components/aceternity/AuroraBackground";
import RightImageSlider from "@/components/RightImageSlider";

const Index = () => {
  return (
    <AuroraBackground>
      <main className="relative z-10 min-h-screen">
        <div className="grid min-h-screen md:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-center bg-white/95 px-6 py-12 sm:px-12 lg:px-16">
            <LoginCard />
          </section>
          <aside className="relative min-h-[320px] md:min-h-0">
            <RightImageSlider
              images={[
                { src: "/pic-1.jpg", alt: "Program fieldwork photo" },

                { src: "/pic-3.jpg", alt: "Community program photo" },
                { src: "/pic-4.jpg", alt: "children getting medicine" }
              ]}
            />
            <div className="absolute bottom-10 left-10 right-10 text-white">
              <p className="text-xs font-semibold tracking-[0.4em] text-white/70">
                ECAP+ platform
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Track progress across communities with confidence.
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Secure reporting, real-time insights, and streamlined monitoring in one place.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <VersionFooter />
    </AuroraBackground>
  );
};

export default Index;
