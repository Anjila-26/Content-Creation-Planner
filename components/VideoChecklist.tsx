'use client';

import { Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  category: string;
  display_order?: number;
}

interface VideoChecklistProps {
  videoId: string;
}

const defaultCategories = {
  'Ideation': [
    'Title Drafted',
    'Target Audience Defined',
    'Research Completed',
    '3-Sec HOOK',
    'Intro Stated',
    'Whole Script Finalize',
    'Memorize/Rehearsed',
  ],
  'Filming': [
    'Shot-list created',
    'Location/Studio prep',
    'Equipment Check',
    'Main footage shoot',
    'B-rolls shot',
    'Extra Overlays/Screenshots',
    'Files Organized/Rename',
  ],
  'Video Editing': [
    'Sound Cleanup',
    'Music Added',
    'Sound Effects Add',
    'Filler words/pause X',
    'Text/Subtitle Added',
    'Graphics Added',
    'Jump Cuts/Transition Applied',
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

export default function VideoChecklist({ videoId }: VideoChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Ideation');
  const [isAdding, setIsAdding] = useState(false);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Load checklist items from database
  useEffect(() => {
    if (initializedRef.current) return; // Don't reload if already initialized
    loadChecklistItems();
  }, [videoId]);

  const loadChecklistItems = async () => {
    if (initializedRef.current || initializingRef.current) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/video-projects/${videoId}/checklist`);
      
      if (!response.ok) {
        throw new Error('Failed to load checklist items');
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Remove duplicates by text and category (keep first occurrence)
        const uniqueItems = data.items.reduce((acc: ChecklistItem[], item: ChecklistItem) => {
          const exists = acc.find(i => i.text === item.text && i.category === item.category);
          if (!exists) {
            acc.push(item);
          }
          return acc;
        }, []);
        
        setItems(uniqueItems);
        initializedRef.current = true;
      } else if (!initializingRef.current && !initializedRef.current) {
        // Initialize with default items if no items exist (only once)
        initializingRef.current = true;
        await initializeDefaultItems();
        initializedRef.current = true;
      }
    } catch (err) {
      console.error('Failed to load checklist items:', err);
      // Fallback to default items if API fails
      if (!initializedRef.current && !initializingRef.current) {
        initializingRef.current = true;
        initializeDefaultItemsLocal();
        initializedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultItems = async () => {
    // Double check - if items already exist, don't create duplicates
    try {
      const checkResponse = await fetch(`/api/video-projects/${videoId}/checklist`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.items && checkData.items.length > 0) {
          setItems(checkData.items);
          return; // Items already exist, don't create duplicates
        }
      }
    } catch (err) {
      console.error('Failed to check existing items:', err);
    }

    const allItems: { text: string; category: string; display_order: number }[] = [];
    let orderCounter = 0;
    
    Object.entries(defaultCategories).forEach(([category, tasks]) => {
      tasks.forEach(task => {
        allItems.push({
          text: task,
          category,
          display_order: orderCounter++,
        });
      });
    });

    // Create all items in database
    try {
      const createPromises = allItems.map(item =>
        fetch(`/api/video-projects/${videoId}/checklist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: item.text,
            category: item.category,
            completed: false,
            display_order: item.display_order,
          }),
        }).then(res => res.json())
      );

      const createdData = await Promise.all(createPromises);
      const createdItems = createdData
        .filter((data: any) => data.item)
        .map((data: any) => data.item);
      setItems(createdItems);
    } catch (err) {
      console.error('Failed to initialize default items:', err);
      // Fallback to local items
      initializeDefaultItemsLocal();
    }
  };

  const initializeDefaultItemsLocal = () => {
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
    
    setItems(allItems);
  };

  const toggleItem = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;
    
    // Optimistic update
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: newCompleted } : item
    ));

    // Save to database
    try {
      await fetch(`/api/video-projects/${videoId}/checklist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: id,
          completed: newCompleted,
        }),
      });
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      // Revert on error
      setItems(items.map(item => 
        item.id === id ? { ...item, completed: !newCompleted } : item
      ));
    }
  };

  const deleteItem = async (id: number) => {
    // Optimistic update
    const originalItems = items;
    setItems(items.filter(item => item.id !== id));

    // Delete from database
    try {
      const response = await fetch(`/api/video-projects/${videoId}/checklist/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete checklist item');
      }
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
      // Revert on error
      setItems(originalItems);
    }
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;

    // Optimistic update
    const tempId = Date.now(); // Temporary ID
    const newItem: ChecklistItem = {
      id: tempId,
      text: newItemText,
      completed: false,
      category: newItemCategory,
    };
    setItems([...items, newItem]);
    const textToSave = newItemText;
    const categoryToSave = newItemCategory;
    setNewItemText('');
    setIsAdding(false);

    // Save to database
    try {
      const response = await fetch(`/api/video-projects/${videoId}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSave,
          category: categoryToSave,
          completed: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checklist item');
      }

      const data = await response.json();
      // Replace temp item with server item
      setItems(prevItems => prevItems.map(item => 
        item.id === tempId ? data.item : item
      ));
    } catch (err) {
      console.error('Failed to create checklist item:', err);
      // Remove temp item on error
      setItems(prevItems => prevItems.filter(item => item.id !== tempId));
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;

  const categoryColors: Record<string, string> = {
    'Ideation': 'border-blue-400',
    'Filming': 'border-rose-400',
    'Video Editing': 'border-amber-400',
    'Publish/Market': 'border-green-400',
  };

  const categoryBgColors: Record<string, string> = {
    'Ideation': 'bg-blue-50',
    'Filming': 'bg-rose-50',
    'Video Editing': 'bg-amber-50',
    'Publish/Market': 'bg-green-50',
  };

  const categoryCheckboxColors: Record<string, string> = {
    'Ideation': 'bg-blue-500',
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-handwriting">Check List</h2>
          <p className="text-sm font-semibold text-gray-700">
            {completedCount} tasks completed
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-handwriting"
            />
            <button
              onClick={addItem}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemText('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-8">
        {categories.map((category) => {
          const categoryItems = groupedItems[category] || [];
          const categoryCompleted = categoryItems.filter(i => i.completed).length;
          const categoryTotal = categoryItems.length;

          return (
            <div key={category} className={`${categoryBgColors[category]} rounded-2xl p-6 border-2 ${categoryColors[category]}`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwriting">{category}</h3>
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setNewItemCategory(category);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={`Add to ${category}`}
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="text-xs font-semibold text-gray-700">
                  {categoryCompleted} completed
                </span>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                        item.completed
                          ? 'bg-green-500 border-green-500 hover:bg-green-600'
                          : 'border-gray-400 bg-white hover:border-gray-500'
                      }`}
                    >
                      {item.completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <p
                          className={`text-sm font-handwriting ${
                            item.completed
                              ? 'text-gray-400 line-through'
                              : 'text-gray-800'
                          }`}
                        >
                          {item.text}
                        </p>
                        <div className="mt-2 border-b border-gray-300"></div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
