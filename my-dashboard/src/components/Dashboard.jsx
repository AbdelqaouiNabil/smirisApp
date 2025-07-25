import React, { useState } from 'react';
import StudentList from './StudentList';
import StudentDetails from './StudentDetails';
import StudentChart from './StudentChart';

const Dashboard = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 bg-white p-4 overflow-y-auto">
        <StudentList onSelectStudent={setSelectedStudent} setStudents={setStudents} />
      </div>
      <div className="w-2/3 p-4">
        {selectedStudent ? (
          <StudentDetails student={selectedStudent} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a student to view details</p>
          </div>
        )}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Application Counts</h2>
          <StudentChart data={students} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
