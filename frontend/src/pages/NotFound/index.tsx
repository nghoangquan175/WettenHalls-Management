import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { useAuth } from '../../contexts/AuthContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center animate-bounce">
          <span className="text-xs font-black text-red-600">404</span>
        </div>
      </div>

      <h1 className="DisplayLBold text-gray-900 mb-4">
        Mất Kết Nối Hoặc Sai Đường?
      </h1>
      <p className="ContentMRegular text-gray-500 max-w-md mb-10 leading-relaxed">
        Bạn vừa đi vào "vùng cấm" hoặc đường dẫn này đã bốc hơi khỏi hệ thống.{' '}
        <br />
        Đừng lo, hãy để chúng tôi đưa bạn về nơi an toàn.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
      </div>

      <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
        Wettenhalls Management System Security Protocol
      </p>
    </div>
  );
};

export default NotFoundPage;
