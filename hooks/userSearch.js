import { useState, useEffect } from 'react';

export const useSearch = (initialData = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(initialData);
  const [sourceData, setSourceData] = useState(initialData);

  const search = (text, newData = sourceData) => {
    setSearchQuery(text);
    setSourceData(newData); // ✅ Update source data
  };

  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    if (!lower) {
      setFilteredData(sourceData);
      return;
    }

    const result = sourceData.filter(item =>
      JSON.stringify(item).toLowerCase().includes(lower)
    );
    setFilteredData(result);
  }, [searchQuery, sourceData]); // ✅ reactively filter when either changes

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    search,
  };
};

