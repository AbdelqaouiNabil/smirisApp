import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StudentList = ({ onSelectStudent, setStudents }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('ausbildung_main_engine')
          .select('id, name, email');

        if (studentsError) throw studentsError;

        const { data: applicationsData, error: applicationsError } = await supabase
          .from('bewerbungen')
          .select('student_id');

        if (applicationsError) throw applicationsError;

        const applicationCounts = applicationsData.reduce((acc, app) => {
          acc[app.student_id] = (acc[app.student_id] || 0) + 1;
          return acc;
        }, {});

        const studentsWithCounts = studentsData.map(student => ({
          ...student,
          applicationCount: applicationCounts[student.id] || 0,
        }));

        setStudents(studentsWithCounts);
        setStudents(studentsWithCounts);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();

    const subscription = supabase
      .channel('public:bewerbungen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bewerbungen' }, fetchStudents)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading students...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <input
        type="text"
        placeholder="Search students..."
        className="w-full p-2 mb-4 border rounded"
        onChange={e => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredStudents.map(student => (
          <li
            key={student.id}
            className="p-2 mb-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
            onClick={() => onSelectStudent(student)}
          >
            {student.name} ({student.applicationCount})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
