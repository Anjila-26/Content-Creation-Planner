'use client';

import { Check, Plus, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  category: string;
}

interface ChecklistProps {
  date?: Date;
}

const defaultCategories = {
  'Ideation': [
    'Target Audience Defined',
    'Research Completed',
    'Whole Script Finalize',
  ],
  'Pre-Production': [
    'Title Drafted',
    'Shot-list created',
    'Location/Studio prep',
    'Equipment Check',
    'Files Organized/Rename',
    'Memorize/Rehearsed',
  ],
  'Filming': [
    'Main footage shoot',
    'B-rolls shot',
    '3-Sec HOOK',
    'Intro Stated',
  ],
  'Video Editing': [
    'Sound Cleanup',
    'Music Added',
    'Sound Effects Add',
    'Filler words/pause X',
    'Text/Subtitle Added',
    'Jump Cuts/Transition Applied',
    'Extra Overlays/Screenshots',
    'Graphics Added',
  ],
  'Publish/Market': [
    'Thumbnail Design',
    'SEO Title/Description',
    'Tags Research + Add',
    'Upload / Schedule',
    'Promos? Or Not',
    'First Hour Engagement',
  ],
};

export default function Checklist({ date }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const allItems: ChecklistItem[] = [];
    let idCounter = 1;
    
    Object.entries(defaultCategories).forEach(([category, tasks]) => {
      tasks.forEach(task => {
        allItems.push({
          id: idCounter++,
          text: task,
          completed: false,
          category,
        });
      });
    });
    
    return allItems;
  });
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Ideation');
  const [isAdding, setIsAdding] = useState(false);

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Math.max(...items.map(i => i.id), 0) + 1,
        text: newItemText,
        completed: false,
        category: newItemCategory,
      };
      setItems([...items, newItem]);
      setNewItemText('');
      setIsAdding(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const categoryColors: Record<string, string> = {
    'Ideation': 'border-l-purple-500 bg-purple-50',
    'Pre-Production': 'border-l-blue-500 bg-blue-50',
    'Filming': 'border-l-rose-500 bg-rose-50',
    'Video Editing': 'border-l-amber-500 bg-amber-50',
    'Publish/Market': 'border-l-green-500 bg-green-50',
  };

  const categoryBadgeColors: Record<string, string> = {
    'Ideation': 'bg-purple-500',
    'Pre-Production': 'bg-blue-500',
    'Filming': 'bg-rose-500',
    'Video Editing': 'bg-amber-500',
    'Publish/Market': 'bg-green-500',
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const categories = Object.keys(defaultCategories);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1 font-handwriting">Content Creator Workflow</h3>
          <p className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 via-blue-400 via-rose-400 via-amber-400 to-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add New Item Input */}
      {isAdding && (
        <div className="mb-4 p-3 rounded-lg border-2 border-purple-500 bg-purple-50">
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="w-full mb-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add new task..."
              autoFocus
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={addItem}
              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemText('');
              }}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Categorized Checklist Items */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {categories.map((category) => {
          const categoryItems = groupedItems[category] || [];
          const categoryCompleted = categoryItems.filter(i => i.completed).length;
          const categoryTotal = categoryItems.length;
          const isCollapsed = collapsedCategories.has(category);

          return (
            <div key={category} className={`border-l-4 rounded-lg ${categoryColors[category] || 'border-l-gray-500 bg-gray-50'}`}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="font-semibold text-sm text-gray-800">{category}</span>
                  <span className={`w-2 h-2 rounded-full ${categoryBadgeColors[category] || 'bg-gray-500'}`} />
                </div>
                <span className="text-xs text-gray-600">
                  {categoryCompleted}/{categoryTotal}
                </span>
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-1.5">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-start gap-2 p-2 rounded-lg border transition-all ${
                        item.completed
                          ? 'bg-white/70 border-gray-200'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                          item.completed
                            ? `${categoryBadgeColors[item.category]} border-transparent`
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {item.completed && <Check className="w-3 h-3 text-white" />}
                      </button>

                      {/* Content */}
                      <p
                        className={`flex-1 text-xs ${
                          item.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-700'
                        }`}
                      >
                        {item.text}
                      </p>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="text-lg font-bold text-gray-800">{totalCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Done</div>
            <div className="text-lg font-bold text-green-600">{completedCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Remaining</div>
            <div className="text-lg font-bold text-orange-600">{totalCount - completedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

