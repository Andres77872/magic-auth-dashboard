import React from 'react';

interface PermissionCategoriesProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  permissionCounts: Record<string, number>;
}

export const PermissionCategories: React.FC<PermissionCategoriesProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  permissionCounts
}) => {
  return (
    <div className="permission-categories">
      <h4>Categories</h4>
      <div className="categories-list">
        <button
          className={`category-item ${!selectedCategory ? 'active' : ''}`}
          onClick={() => onCategorySelect('')}
        >
          <span className="category-name">All Categories</span>
          <span className="category-count">
            {Object.values(permissionCounts).reduce((sum, count) => sum + count, 0)}
          </span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category}
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategorySelect(category)}
          >
            <span className="category-name">{category}</span>
            <span className="category-count">{permissionCounts[category] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 