import { useState, useEffect } from 'react';

export const useSearch = (initialData = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(initialData);
  const [sourceData, setSourceData] = useState(initialData);

  const search = (text, newData = sourceData) => {
    setSearchQuery(text);
    setSourceData(newData);
  };

  useEffect(() => {
    const lower = searchQuery.toLowerCase().trim();

    if (!lower) {
      setFilteredData(sourceData);
      return;
    }

    const result = sourceData.filter((task) => {
      const fieldsToSearch = [
        task?.employee?.employee_name,
        task?.client?.client_name,
        task?.taskType?.taskType,
        task?.description,
        task?.dropLocation?.address,
        task?.pickUpLocation?.address,
        task?.client?.pincode?.toString(),
        task?.state?.toString(),
        task?.id?.toString(),
        task?.client?.contact_number?.toString(),
        task?.client?.email?.toLowerCase(),
        task?.client?.client_code?.toLowerCase(),
        task?.preferredDate,
        task?.taskFrequency,
        task?.taskGroup,
        ...((task?.items || []).map(i => i?.item?.itemName)),
      ];

      return fieldsToSearch.some(field =>
        field?.toString().toLowerCase().includes(lower)
      );
    });

    setFilteredData(result);
  }, [searchQuery, sourceData]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    search,
  };
};
