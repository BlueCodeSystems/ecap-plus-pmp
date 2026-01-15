import LoginCard from "@/components/LoginCard";
import VersionFooter from "@/components/VersionFooter";
import classroomBg from "@/assets/classroom-bg.jpg";

const Index = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${classroomBg})` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-overlay/60" />
      
      {/* Content */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-20">
        <LoginCard />
      </main>
      
      {/* Footer */}
      <VersionFooter />
    </div>
  );
};

export default Index;
