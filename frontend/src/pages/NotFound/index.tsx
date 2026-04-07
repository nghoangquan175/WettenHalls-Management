import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <AlertTriangle className="w-12 h-12 text-warning" />
      </div>
      
      <h1 className="DisplayXLBold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="ContentLMedium text-gray-500 max-w-md mb-10">
        Oops! The page you're looking for doesn't exist or has been moved to a different location.
      </p>
      
      <Button
        variant="primary"
        size="lg"
        onClick={() => navigate('/')}
        leftIcon={<Home className="w-5 h-5" />}
      >
        Back to Safety
      </Button>
    </div>
  );
};

export default NotFoundPage;
