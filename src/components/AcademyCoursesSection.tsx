import React from 'react';
import { GraduationCap, Clock, Award, BookOpen, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { AcademyCourse } from '../types/database';

interface AcademyCoursesSectionProps {
  courses: AcademyCourse[];
  onEnrollCourse: (course: AcademyCourse) => void;
}

export const AcademyCoursesSection: React.FC<AcademyCoursesSectionProps> = ({
  courses,
  onEnrollCourse,
}) => {
  return (
    <section id="courses-section" className="py-12 border-t border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Blue & Red Accents */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-blue-900/30 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              <GraduationCap className="w-4 h-4 text-red-500" />
              <span>Music & Performing Arts Education</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-red-500">🎓</span>
              <span>The NC Creation's Academy</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Professional training by Music Director Keerthi Senkadagala and veteran artists in Gurudeniya, Kandy. Master voice culture for TV reality shows, audio engineering, and classical instruments.
            </p>
          </div>

          <div className="text-xs text-blue-300 font-mono bg-blue-950/40 border border-blue-700/40 px-3.5 py-1.5 rounded-xl shrink-0 font-semibold">
            Now Enrolling for Next Intake
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.courseId}
              className="glass-panel rounded-2xl p-6 sm:p-7 border border-blue-900/20 hover:border-blue-500/50 transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-blue-950/20"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-blue-300 font-bold bg-blue-600/15 px-2.5 py-0.5 rounded-lg border border-blue-500/30 font-mono">
                    {course.courseId}
                  </span>
                  <span className="text-slate-400 font-medium">Instructor: {course.instructor}</span>
                </div>

                {/* Course Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                {course.sinhalaTitle && (
                  <div className="text-sm font-semibold text-red-400 mt-1 mb-3">
                    {course.sinhalaTitle}
                  </div>
                )}

                {/* Course Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {course.description}
                </p>

                {/* Meta Strip */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-blue-950/20 border border-blue-900/30 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Schedule</span>
                    <span className="text-slate-200 font-medium">{course.schedule}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tuition / Fee</span>
                    <span className="text-red-400 font-bold tabular-nums">{course.fee}</span>
                  </div>
                </div>

                {/* Syllabus Highlights */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-red-400" />
                    Curriculum Highlights:
                  </span>
                  {course.syllabusHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onEnrollCourse(course)}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 hover:border-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Enroll in Course / Contact Academy</span>
                <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
