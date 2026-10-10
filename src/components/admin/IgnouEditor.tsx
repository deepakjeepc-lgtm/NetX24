import React, { useState, useEffect } from 'react';
import { useIgnouData } from '../../context/IgnouDataContext';
import { Level, Course, Year, Subject } from '../../data/ignouData';
import { Plus, Trash2, Edit2, Check, X, ChevronRight, ChevronDown, Save, Loader2 } from 'lucide-react';

export default function IgnouEditor() {
  const { assignmentsData, projectsData, loading, updateData } = useIgnouData();
  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');
  const initialData = activeCategory === 'assignment' ? assignmentsData : projectsData;
  const [data, setData] = useState<Level[]>([]);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setData(JSON.parse(JSON.stringify(initialData))); // Deep copy
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage('');
      await updateData(activeCategory === 'assignment' ? 'assignments' : 'projects', data);
      setMessage('Changes saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`Error saving: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateLevel = (lIndex: number, newLevel: Level) => {
    const newData = [...data];
    newData[lIndex] = newLevel;
    setData(newData);
  };

  const deleteLevel = (lIndex: number) => {
    if(confirm('Delete this level and all its courses?')) {
      const newData = [...data];
      newData.splice(lIndex, 1);
      setData(newData);
    }
  };

  const addLevel = () => {
    const newId = `level_${Date.now()}`;
    setData([...data, { id: newId, name: 'New Level', courses: [] }]);
    setExpandedLevel(newId);
  };

  const addCourse = (lIndex: number) => {
    const newId = `course_${Date.now()}`;
    const level = { ...data[lIndex] };
    level.courses = [...level.courses, { id: newId, name: 'New Course', fullName: 'New Course Full Name', years: [] }];
    updateLevel(lIndex, level);
    setExpandedCourse(newId);
  };

  const addYear = (lIndex: number, cIndex: number) => {
    const level = { ...data[lIndex] };
    const course = { ...level.courses[cIndex] };
    course.years = [...course.years, { name: 'New Year/Sem', subjects: [] }];
    level.courses[cIndex] = course;
    updateLevel(lIndex, level);
    setExpandedYear(`${course.id}-New Year/Sem`);
  };

  const addSubject = (lIndex: number, cIndex: number, yIndex: number) => {
    const level = { ...data[lIndex] };
    const course = { ...level.courses[cIndex] };
    const year = { ...course.years[yIndex] };
    year.subjects = [...year.subjects, { code: 'NEW-CODE', name: 'New Subject', price: 0 }];
    course.years[yIndex] = year;
    level.courses[cIndex] = course;
    updateLevel(lIndex, level);
  };

  if (loading) return <div className="p-4 text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading IGNOU Data...</div>;

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-[2rem] shadow-lg shadow-indigo-500/5 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
      <div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[#1C1D20] dark:text-white text-xl">Manage IGNOU Data</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 mb-4">Configure degrees, courses, and subjects</p>
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
            <button
              onClick={() => setActiveCategory('assignment')}
              className={`px-6 py-2 rounded-full font-bold text-xs transition-all ${
                activeCategory === 'assignment'
                  ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveCategory('project')}
              className={`px-6 py-2 rounded-full font-bold text-xs transition-all ${
                activeCategory === 'project'
                  ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Projects
            </button>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#1C1D20] dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-md disabled:opacity-50 hover:-translate-y-0.5"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save All Changes
        </button>
      </div>

      <div className="p-6 md:p-8">
        {message && (
          <div className={`p-4 rounded-xl mb-6 text-[11px] font-bold tracking-widest uppercase ${message.includes('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'}`}>
            {message}
          </div>
        )}
        
        <div className="space-y-6">
          {data.map((level, lIndex) => (
            <div key={level.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm transition-colors">
              <div className="bg-slate-100/70 dark:bg-slate-800/80 px-5 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3 w-full">
                  <button onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                    {expandedLevel === level.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <input 
                    type="text"
                    value={level.name}
                    onChange={(e) => {
                      const newLevel = { ...level, name: e.target.value };
                      updateLevel(lIndex, newLevel);
                    }}
                    className="font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 outline-none px-1 py-0.5 w-full max-w-xs transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addCourse(lIndex)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1"><Plus className="w-4 h-4"/> Course</button>
                  <button onClick={() => deleteLevel(lIndex)} className="p-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800/60"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              
              {expandedLevel === level.id && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/60 space-y-4">
                  {level.courses.length === 0 && <div className="text-sm text-slate-400 dark:text-slate-500 italic">No courses added.</div>}
                  {level.courses.map((course, cIndex) => (
                    <div key={course.id} className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden ml-2 md:ml-6 bg-white dark:bg-slate-800/50 shadow-sm">
                      <div className="bg-slate-100/80 dark:bg-slate-800/90 px-4 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80">
                        <div className="flex items-center gap-3 w-full">
                           <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                            {expandedCourse === course.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div className="flex flex-col gap-1 w-full max-w-md">
                            <input 
                              type="text"
                              value={course.name}
                              onChange={(e) => {
                                const newCourse = { ...course, name: e.target.value };
                                const newLevel = { ...level };
                                newLevel.courses[cIndex] = newCourse;
                                updateLevel(lIndex, newLevel);
                              }}
                              placeholder="Course Short Name (e.g. BCA)"
                              className="font-semibold text-slate-800 dark:text-white text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 outline-none px-1 transition-colors"
                            />
                            <input 
                              type="text"
                              value={course.fullName}
                              onChange={(e) => {
                                const newCourse = { ...course, fullName: e.target.value };
                                const newLevel = { ...level };
                                newLevel.courses[cIndex] = newCourse;
                                updateLevel(lIndex, newLevel);
                              }}
                              placeholder="Course Full Name"
                              className="text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 outline-none px-1 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => addYear(lIndex, cIndex)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Year/Sem</button>
                           <button 
                             onClick={() => {
                               if(confirm('Delete course?')) {
                                  const newLevel = { ...level };
                                  newLevel.courses.splice(cIndex, 1);
                                  updateLevel(lIndex, newLevel);
                               }
                             }} 
                             className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg"
                           >
                             <Trash2 className="w-4 h-4"/>
                           </button>
                        </div>
                      </div>
                      
                      {expandedCourse === course.id && (
                        <div className="p-3 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                          {course.years.length === 0 && <div className="text-sm text-slate-400 dark:text-slate-500 italic">No years/semesters added.</div>}
                          {course.years.map((year, yIndex) => (
                            <div key={yIndex} className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden ml-2 md:ml-4 bg-white dark:bg-slate-800/70 shadow-sm">
                              <div className="bg-slate-100/60 dark:bg-slate-800 px-3 py-2.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/80">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setExpandedYear(expandedYear === `${course.id}-${yIndex}` ? null : `${course.id}-${yIndex}`)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    {expandedYear === `${course.id}-${yIndex}` ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                  <input 
                                    type="text"
                                    value={year.name}
                                    onChange={(e) => {
                                      const newYear = { ...year, name: e.target.value };
                                      const newLevel = { ...level };
                                      newLevel.courses[cIndex].years[yIndex] = newYear;
                                      updateLevel(lIndex, newLevel);
                                    }}
                                    placeholder="Year/Semester Name"
                                    className="font-medium text-sm text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 outline-none px-1 transition-colors w-32 md:w-48"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => addSubject(lIndex, cIndex, yIndex)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg whitespace-nowrap flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Subject</button>
                                  <button 
                                    onClick={() => {
                                      if(confirm('Delete year?')) {
                                          const newLevel = { ...level };
                                          newLevel.courses[cIndex].years.splice(yIndex, 1);
                                          updateLevel(lIndex, newLevel);
                                      }
                                    }} 
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5"/>
                                  </button>
                                </div>
                              </div>
                              
                              {expandedYear === `${course.id}-${yIndex}` && (
                                <div className="p-3 bg-white dark:bg-slate-900/80">
                                  {year.subjects.length === 0 && <div className="text-xs text-slate-400 dark:text-slate-500 italic p-2">No subjects added.</div>}
                                  {year.subjects.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden min-w-[700px]">
                                        <thead className="bg-slate-100/80 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">
                                          <tr>
                                            <th className="px-3 py-2.5 w-[12%]">Code</th>
                                            <th className="px-3 py-2.5 w-[18%]">Subject Name</th>
                                            <th className="px-3 py-2.5 w-[8%]">Price (₹)</th>
                                            <th className="px-3 py-2.5 w-[18%]">Notes PDF Link</th>
                                            <th className="px-3 py-2.5 w-[18%]">Notes Demo</th>
                                            <th className="px-3 py-2.5 w-[18%]">Handw. Demo</th>
                                            <th className="px-2 py-2.5 w-[8%]"></th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                                          {year.subjects.map((sub, sIndex) => (
                                            <tr key={sIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="text" 
                                                  value={sub.code} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].code = e.target.value;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  className="w-full px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="text" 
                                                  value={sub.name} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].name = e.target.value;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  className="w-full px-2 py-1 text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="number" 
                                                  value={sub.price} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].price = Number(e.target.value) || 0;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  className="w-full px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="text" 
                                                  value={sub.pdfLink || ''} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].pdfLink = e.target.value;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  placeholder="Download URL"
                                                  className="w-full px-2 py-1 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="text" 
                                                  value={sub.demoLink || ''} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].demoLink = e.target.value;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  placeholder="Notes Demo URL"
                                                  className="w-full px-2 py-1 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-3 py-2">
                                                <input 
                                                  type="text" 
                                                  value={sub.handwrittenDemoLink || ''} 
                                                  onChange={(e) => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects[sIndex].handwrittenDemoLink = e.target.value;
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  placeholder="Handwritten Demo URL"
                                                  className="w-full px-2 py-1 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-colors"
                                                />
                                              </td>
                                              <td className="px-2 py-2 text-right">
                                                <button 
                                                  onClick={() => {
                                                    const newLevel = { ...level };
                                                    newLevel.courses[cIndex].years[yIndex].subjects.splice(sIndex, 1);
                                                    updateLevel(lIndex, newLevel);
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 rounded"
                                                >
                                                  <X className="w-4 h-4"/>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={addLevel}
          className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Level
        </button>

      </div>
    </div>
  );
}
