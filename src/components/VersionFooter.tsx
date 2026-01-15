const VersionFooter = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
  
  const formattedTime = currentDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-overlay/80 backdrop-blur-sm py-3 px-6">
      <div className="container mx-auto flex justify-between items-center text-overlay-foreground text-sm">
        <span className="font-medium">Version v2.1.0</span>
        <div className="flex gap-6">
          <span>Date: {formattedDate}</span>
          <span>Time: {formattedTime}</span>
        </div>
      </div>
    </footer>
  );
};

export default VersionFooter;
