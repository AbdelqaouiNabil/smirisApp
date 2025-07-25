import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StudentDetails = ({ student }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!student) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bewerbungen')
          .select('*')
          .eq('student_id', student.id);

        if (error) throw error;
        setApplications(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    const subscription = supabase
      .channel(`public:bewerbungen:student_id=eq.${student.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bewerbungen', filter: `student_id=eq.${student.id}` }, fetchApplications)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [student]);

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{student.name}'s Applications</h2>
      {applications.length > 0 ? (
        <table className="w-full text-left table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2">Job Title</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Date Applied</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} className="bg-white">
                <td className="border px-4 py-2">{app.job_title}</td>
                <td className="border px-4 py-2">{app.company_name}</td>
                <td className="border px-4 py-2">{new Date(app.date_applied).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No applications found for this student.</p>
      )}
    </div>
  );
};

export default StudentDetails;
