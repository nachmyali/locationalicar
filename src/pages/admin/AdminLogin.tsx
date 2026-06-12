import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { LogIn } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <h1 className="font-poppins text-2xl font-bold text-remons-dark">Administration</h1>
          <p className="text-remons-gray text-sm font-inter mt-1">AliCar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder="contact@locationalicar.com"
            />
          </div>

          <div>
            <label className="block text-sm font-inter font-medium text-remons-dark mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-remons-border rounded-xl px-4 py-3 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-remons-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm font-inter text-remons-primary text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-remons-primary text-white font-poppins text-sm font-medium py-3 rounded-xl hover:bg-remons-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <LogIn size={16} />
                Se connecter
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
