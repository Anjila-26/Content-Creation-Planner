'use client';

import { MessageSquare, PaperclipIcon, UserCircle } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    category?: string;
    tags?: string[];
    progress?: number;
    due_date?: string;
    assignees?: string[];
  };
  onStatusChange?: (id: number, newStatus: string) => void;
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const statusColors = {
    todo: 'bg-blue-100',
    in_progress: 'bg-amber-100',
    in_review: 'bg-blue-100',
    done: 'bg-green-100',
  };

  const categoryColors = {
    "#youtube": 'bg-red-100 text-red-700',
    "#frontend": 'bg-blue-100 text-blue-700',
    "#backend": 'bg-green-100 text-green-700',
    "#design": 'bg-purple-100 text-purple-700',
    "#content": 'bg-pink-100 text-pink-700',
  };

  const bgColor = statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100';

  return (
    <div className={`${bgColor} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          {task.category && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              categoryColors[task.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700'
            }`}>
              {task.category}
            </span>
          )}
          {task.tags && task.tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-white/70">
              {tag}
            </span>
          ))}
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 mb-2 text-sm leading-snug">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      {task.progress !== undefined && task.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-800">{task.progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Circles */}
      {task.status === 'in_progress' && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < (task.progress || 0) / 10 ? 'bg-orange-400' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/30">
        {/* Assignees */}
        <div className="flex -space-x-2">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.slice(0, 3).map((assignee, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center"
                title={assignee}
              >
                <span className="text-xs text-white font-medium">
                  {assignee.charAt(0).toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <UserCircle className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-gray-600">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{Math.floor(Math.random() * 20)}</span>
          </div>
          <div className="flex items-center gap-1">
            <PaperclipIcon className="w-4 h-4" />
            <span className="text-xs">{Math.floor(Math.random() * 10)}</span>
          </div>
        </div>
      </div>

      {/* Due Date */}
      {task.due_date && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{task.due_date}</span>
        </div>
      )}
    </div>
  );
}
