import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tutorsApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

export default function TutorProfileCompletePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCV] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'tutor') {
      toast({ title: 'Nicht autorisiert', variant: 'destructive' });
      return;
    }
    if (!photo || !cv) {
      toast({ title: 'Bitte laden Sie ein Foto und einen Lebenslauf hoch.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('cv', cv);
      certificates.forEach(file => formData.append('certificates', file));
      
      // Debug: Log FormData contents
      console.log('FormData created:');
      console.log('Photo file:', photo);
      console.log('CV file:', cv);
      console.log('Certificates:', certificates);
      
      // Debug: Check FormData entries
      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key} =`, value);
      }
      
      await tutorsApi.uploadProfileDocuments(formData);
      toast({ title: 'Profil erfolgreich vervollständigt!', variant: 'default' });
      navigate('/tutor-dashboard');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Fehler beim Hochladen', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">Profil vervollständigen</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Profilfoto *</label>
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block mb-2 font-medium">Lebenslauf (CV) *</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCV(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block mb-2 font-medium">Zertifikate (optional, mehrere möglich)</label>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setCertificates(Array.from(e.target.files || []))} />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Hochladen...' : 'Profil abschließen'}
        </button>
      </form>
    </div>
  );
} 