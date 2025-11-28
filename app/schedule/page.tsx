'use client';

import { ChevronLeft, ChevronRight, Plus, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import Sidebar from '../../components/Sidebar';
import VideoDetailModal from '../../components/VideoDetailModal';
import { getVideoProjects, VideoProject, updateVideoProject } from '../../lib/video-projects';

interface VideoEvent {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  date: Date;
  color: string;
  type: 'production' | 'release';
  projectId: number;
}

const getMiniCalendarDates = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const dates = [];
  const current = new Date(startDate);
  
  while (dates.length < 42) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

const getWeekDates = (date: Date) => {
  const dates = [];
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  current.setDate(current.getDate() - dayOfWeek);
  
  // Start from Sunday, show 7 days (full week)
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'production' | 'release'>('production');
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const miniCalendarDates = getMiniCalendarDates(currentDate);
  const weekDates = getWeekDates(currentDate);

  useEffect(() => {
    loadVideoProjects();
    // Refresh events every 30 seconds to sync with any changes
    const interval = setInterval(() => {
      loadVideoProjects();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadVideoProjects = async () => {
    try {
      setLoading(true);
      const projects = await getVideoProjects();
      const videoEvents: VideoEvent[] = [];

      projects.forEach((project: VideoProject) => {
        // Add production date event
        if (project.production_date) {
          const prodDate = new Date(project.production_date);
          prodDate.setHours(10, 0, 0, 0); // Set to 10:00 AM
          videoEvents.push({
            id: project.id * 1000 + 1, // Unique ID for production
            title: project.title,
            subtitle: project.rough_sketch || 'Production',
            time: '',
            date: prodDate,
            color: 'bg-blue-400',
            type: 'production',
            projectId: project.id,
          });
        }

        // Add release date event
        if (project.release_date) {
          const releaseDate = new Date(project.release_date);
          releaseDate.setHours(14, 0, 0, 0); // Set to 2:00 PM
          videoEvents.push({
            id: project.id * 1000 + 2, // Unique ID for release
            title: project.title,
            subtitle: 'Release',
            time: '',
            date: releaseDate,
            color: 'bg-green-400',
            type: 'release',
            projectId: project.id,
          });
        }
      });

      setEvents(videoEvents);
    } catch (error) {
      console.error('Error loading video projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const sameDay = event.date.toDateString() === date.toDateString();
      const typeMatch = activeTab === event.type;
      return sameDay && typeMatch;
    });
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 5);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 5);
    setCurrentDate(newDate);
  };

  // Drag and drop handlers
  function handleDragStart(event: any) {
    setActiveId(event.active.id);
    setDraggedEventId(null);
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id && over?.id && active.id !== over.id) {
      // Find dragged event
      const draggedEvent = events.find(e => e.id === active.id);
      if (draggedEvent) {
        setDraggedEventId(active.id);
        
        // Parse the date key (YYYY-MM-DD format)
        const dateString = over.id as string;
        const [year, month, day] = dateString.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);
        
        // Preserve the time from the original event
        const originalTime = draggedEvent.date;
        newDate.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
        
        // Update local state immediately for UI responsiveness
        setEvents(events.map(e =>
          e.id === active.id ? { ...e, date: newDate } : e
        ));

        // Update the video project in the database
        try {
          // Use the dateString directly (already in YYYY-MM-DD format)
          if (draggedEvent.type === 'production') {
            await updateVideoProject(draggedEvent.projectId, {
              production_date: dateString,
            });
          } else if (draggedEvent.type === 'release') {
            await updateVideoProject(draggedEvent.projectId, {
              release_date: dateString,
            });
          }
          // No need to reload - optimistic update already applied
          // The 30-second interval will sync any discrepancies
        } catch (error) {
          console.error('Error updating video project date:', error);
          // Revert on error by reloading
          await loadVideoProjects();
        }
      }
    }
    setActiveId(null);
    // Reset draggedEventId after a delay to allow click handler to check
    setTimeout(() => setDraggedEventId(null), 200);
  }

  // Helper for draggable event card (square for weekly, rectangle for monthly)
  function DraggableEventCard({ event, compact = false }: { event: VideoEvent; compact?: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: event.id });
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
    const wasJustDragged = useRef(false);

    // Track if this event was just dragged
    useEffect(() => {
      if (draggedEventId === event.id) {
        wasJustDragged.current = true;
        const timer = setTimeout(() => {
          wasJustDragged.current = false;
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [draggedEventId, event.id]);

    const handleMouseDown = (e: React.MouseEvent) => {
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      wasJustDragged.current = false;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (!mouseDownPos.current) return;
      
      const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
      const wasClick = deltaX < 5 && deltaY < 5; // Less than 5px movement = click
      
      // Only open modal if it was a click (not a drag) and not currently dragging
      if (wasClick && !isDragging && !wasJustDragged.current && activeId === null) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedVideoId(event.projectId);
        setIsModalOpen(true);
      }
      
      mouseDownPos.current = null;
    };

    if (compact) {
      // Compact rectangular version for monthly view
      return (
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
            isDragging ? 'opacity-0' : 'opacity-100 hover:opacity-80'
          } ${event.color} rounded px-2 py-1 text-xs text-white line-clamp-1 shadow-sm mb-1`}
          style={{ touchAction: 'none' }}
          title={`${event.title} - Click to view details`}
        >
          {event.title}
        </div>
      );
    }

    // Full square version for weekly view
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
          isDragging ? 'opacity-0' : 'opacity-100 hover:scale-105 hover:shadow-lg'
        } ${event.color} rounded-lg p-2 mb-2 shadow-md aspect-square flex flex-col justify-between`}
        style={{ touchAction: 'none' }}
        title="Click to view details, drag to move"
      >
        <div>
          <h4 className="font-bold text-white text-xs mb-0.5 line-clamp-2">{event.title}</h4>
          <p className="text-xs text-white/90 mb-1 line-clamp-2">{event.subtitle}</p>
        </div>
        <p className="text-xs text-white/80">
          {event.type === 'production' ? 'Production' : 'Release'} Date: {formatDateDisplay(event.date)}
        </p>
      </div>
    );
  }

  // Event card component for rendering (without drag functionality)
  function EventCard({ event, compact = false }: { event: VideoEvent; compact?: boolean }) {
    if (compact) {
      // Compact rectangular version for monthly view drag overlay
      return (
        <div className={`${event.color} rounded px-2 py-1 text-xs text-white line-clamp-1 shadow-sm`}>
          {event.title}
        </div>
      );
    }
    
    // Full square version for weekly view drag overlay
    return (
      <div className={`${event.color} rounded-lg p-2 shadow-lg cursor-grabbing aspect-square flex flex-col justify-between`}>
        <div>
          <h4 className="font-bold text-white text-xs mb-0.5 line-clamp-2">{event.title}</h4>
          <p className="text-xs text-white/90 mb-1 line-clamp-2">{event.subtitle}</p>
        </div>
        <p className="text-xs text-white/80">
          {event.type === 'production' ? 'Production' : 'Release'} Date: {formatDateDisplay(event.date)}
        </p>
      </div>
    );
  }

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for display (e.g., "Nov 15, 2025")
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper for droppable day cell
  function DroppableDayCell({ date, children }: { date: Date, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: formatDateKey(date) });
    return (
      <div 
        ref={setNodeRef} 
        className={`transition-all duration-300 ease-in-out rounded-xl ${
          isOver 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 ring-4 ring-blue-300 ring-opacity-50 scale-105 shadow-xl' 
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 relative">
      <Sidebar />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={previousWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-800">
                    {(() => {
                      const startDate = weekDates[0];
                      const endDate = weekDates[weekDates.length - 1];
                      const startDay = startDate.getDate();
                      const endDay = endDate.getDate();
                      const month = startDate.toLocaleDateString('en-US', { month: 'short' });
                      const year = startDate.getFullYear();
                      return `${startDay}-${endDay} ${month} ${year}`;
                    })()}
                  </h1>
                  <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadVideoProjects}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh schedule"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  {['Daily', 'Weekly', 'Monthly'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode.toLowerCase() as any)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode.toLowerCase()
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 font-semibold">
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mt-4">
              <button 
                onClick={() => setActiveTab('production')}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                  activeTab === 'production'
                    ? 'text-blue-700 border-blue-700'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                Production Calendar
              </button>
              <button 
                onClick={() => setActiveTab('release')}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                  activeTab === 'release'
                    ? 'text-blue-700 border-blue-700'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                Release Calendar
              </button>
            </div>
          </header>

          {/* Calendar Grid */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading schedule...</div>
                </div>
              ) : viewMode === 'monthly' ? (
                <>
                  {/* Monthly View */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={previousMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button 
                          onClick={nextMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                    </div>

                    {/* Days of Week Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <div className="grid grid-cols-7 gap-1">
                        {miniCalendarDates.map((date, index) => {
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                          const isToday = date.toDateString() === new Date().toDateString();
                          const dayEvents = getEventsForDate(date);
                          
                          return (
                            <DroppableDayCell key={index} date={date}>
                              <div 
                                className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                                  isCurrentMonth 
                                    ? isToday 
                                      ? 'bg-blue-50 border-blue-300' 
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                    : 'bg-gray-50 border-gray-100'
                                }`}
                              >
                                <div className={`text-xs font-semibold mb-1 ${
                                  isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                                }`}>
                                  {date.getDate()}
                                  {!isCurrentMonth && (
                                    <span className="ml-1 text-gray-400">
                                      {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {dayEvents.slice(0, 3).map(event => (
                                    <DraggableEventCard key={event.id} event={event} compact={true} />
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <div className="text-xs text-gray-500 px-2">
                                      +{dayEvents.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DroppableDayCell>
                          );
                        })}
                      </div>
                      
                      <DragOverlay dropAnimation={{
                        duration: 300,
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                      }}>
                        {activeId ? (
                          <EventCard event={events.find(e => e.id === activeId)!} compact={true} />
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </div>
                </>
              ) : (
                <>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {weekDates.map((date, index) => (
                      <div key={index} className="text-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-4xl font-bold ${
                          date.toDateString() === new Date().toDateString()
                            ? 'text-blue-700 border-b-4 border-blue-700'
                            : 'text-gray-800'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDates.map((date, index) => (
                        <DroppableDayCell key={index} date={date}>
                          <div className="p-2 min-h-[600px] rounded-xl shadow-sm">
                            {getEventsForDate(date).map(event => (
                              <DraggableEventCard key={event.id} event={event} />
                            ))}
                          </div>
                        </DroppableDayCell>
                      ))}
                    </div>
                    
                    <DragOverlay dropAnimation={{
                      duration: 300,
                      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    }}>
                      {activeId ? (
                        <EventCard event={events.find(e => e.id === activeId)!} />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Video Detail Modal */}
      {selectedVideoId && (
        <VideoDetailModal
          videoId={selectedVideoId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVideoId(null);
          }}
        />
      )}
    </div>
  );
}