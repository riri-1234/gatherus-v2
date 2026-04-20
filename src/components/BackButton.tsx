import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
