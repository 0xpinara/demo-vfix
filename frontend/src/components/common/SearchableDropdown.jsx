import { useState, useEffect, useRef } from 'react';
import './SearchableDropdown.css';

function SearchableDropdown({ options, onSelect, placeholder, displayKey = 'full_name', secondaryDisplayKey = 'email', disabled = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
      return;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = options.filter(option =>
      (option[displayKey]?.toLowerCase().includes(lowercasedFilter)) ||
      (option[secondaryDisplayKey]?.toLowerCase().includes(lowercasedFilter))
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options, displayKey, secondaryDisplayKey]);

  const handleSelect = (option) => {
    onSelect(option);
    setSelectedOption(option);
    setSearchTerm(option[displayKey] || '');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (selectedOption) {
      setSelectedOption(null);
      onSelect(null); // Clear parent state if user types again
    }
  }

  return (
    <div className={`searchable-dropdown ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => !disabled && setIsOpen(true)}
        className="dropdown-input"
        disabled={disabled}
      />
      {isOpen && (
        <ul className="dropdown-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li key={option.id} onClick={() => handleSelect(option)} className="dropdown-item">
                {option[displayKey]}
                {secondaryDisplayKey && <span className="item-secondary">{option[secondaryDisplayKey]}</span>}
              </li>
            ))
          ) : (
            <li className="dropdown-item-none">Seçenek Bulunamadı.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default SearchableDropdown;
