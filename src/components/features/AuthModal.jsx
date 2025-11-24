import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  login, 
  authError 
}) {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(authEmail, authPassword);
    if (success) {
        onClose();
        setAuthEmail('');
        setAuthPassword('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Captain Login"
      size="sm"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {authError}
          </div>
        )}
        
        <div className="space-y-4">
          <Input 
            label="Email Address" 
            type="email"
            placeholder="captain@deck.com"
            value={authEmail} 
            onChange={setAuthEmail}
            prefix={<User size={14} />}
          />
          <Input 
            label="Password" 
            type="password"
            placeholder="••••••••"
            value={authPassword} 
            onChange={setAuthPassword}
            prefix={<Lock size={14} />}
          />
        </div>

        <div className="pt-2">
          <Button variant="primary" className="w-full" onClick={handleLogin}>
            Board the Ship
          </Button>
        </div>
      </form>
    </Modal>
  );
}
