import React, { useState, useEffect, useRef } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addYears, 
  subYears, 
  setMonth, 
  setYear, 
  eachDayOfInterval,
  isToday,
  isValid,
  parse
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X 
} from "lucide-react";

// --- Utility for conditional classes ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Constants ---
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// --- The DatePicker Component ---
const Calendar = ({
  selectedDate,
  onChange = () => {},
  className = "",
  placeholder = "Select a date",
  mode,
  selected,
  onSelect,
  disabled
}) => {
  // Handle both prop styles
  const actualSelected = selected || selectedDate;
  const actualOnChange = onSelect || onChange;
  // Views: 'days' | 'months' | 'years'
  const [view, setView] = useState("days");
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // Tracks the currently viewed month/year
  const [inputValue, setInputValue] = useState(""); // Input field state
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize internal state with props if needed
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setInputValue(format(selectedDate, "PPP")); // Format: Aug 10th, 2023
    } else {
      setInputValue("");
    }
  }, [selectedDate]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setView("days");
        
        // Reset input to formatted date on close if valid, or clear if invalid/empty
        if (selectedDate) {
          setInputValue(format(selectedDate, "PPP"));
        } else {
          setInputValue("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedDate]);

  // Navigation Logic
  const handlePrev = () => {
    if (view === "days") setCurrentDate(subMonths(currentDate, 1));
    if (view === "months") setCurrentDate(subYears(currentDate, 1));
    if (view === "years") setCurrentDate(subYears(currentDate, 12));
  };

  const handleNext = () => {
    if (view === "days") setCurrentDate(addMonths(currentDate, 1));
    if (view === "months") setCurrentDate(addYears(currentDate, 1));
    if (view === "years") setCurrentDate(addYears(currentDate, 12));
  };

  const handleDateSelect = (date) => {
    actualOnChange(date);
    setIsOpen(false);
    setInputValue(format(date, "PPP"));
  };

  const handleMonthSelect = (monthIndex) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    setView("days");
  };

  const handleYearSelect = (year) => {
    const newDate = setYear(currentDate, year);
    setCurrentDate(newDate);
    setView("months");
  };

  // Input Handling
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true); // Open calendar while typing

    // Basic Javascript Date Parsing (Robust enough for standard inputs like "12/12/2023" or "Jan 12 2024")
    const parsedDate = new Date(value);

    // If valid date and logic is sound (not "Invalid Date")
    if (isValid(parsedDate) && value.length > 2) {
      setCurrentDate(parsedDate); // Jump calendar to that month/year
      // Optional: Select it live? Or just preview? 
      // Let's preview in calendar (setCurrentDate) but wait for Enter or Click to confirm (onChange)
      // Actually, for "writeable" feel, let's update if it's a strict valid date to avoid flickering on partial types
      if (parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
        actualOnChange(parsedDate);
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsOpen(false);
      if (selectedDate) {
          setInputValue(format(selectedDate, "PPP"));
      }
      inputRef.current?.blur();
    }
  };

  // Renderers
  const renderHeader = () => {
    return (
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setView("months")}
          className={cn(
            "px-2 py-1 rounded-md text-sm font-semibold transition-colors",
            view === "months" 
              ? "bg-gray-100 text-black" 
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          {format(currentDate, "MMMM")}
        </button>
        <button 
          onClick={() => setView("years")}
          className={cn(
            "px-2 py-1 rounded-md text-sm font-semibold transition-colors",
            view === "years" 
              ? "bg-gray-100 text-black" 
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          {format(currentDate, "yyyy")}
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="animate-in fade-in zoom-in-95 duration-200">
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1" role="grid">
          {days.map((day, idx) => {
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => handleDateSelect(day)}
                disabled={!isCurrentMonth}
                className={cn(
                  "h-9 w-9 rounded-full text-sm flex items-center justify-center relative transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
                  !isCurrentMonth && "text-gray-300 opacity-0 cursor-default",
                  isCurrentMonth && "hover:bg-gray-100 text-gray-700",
                  isTodayDate && !isSelected && "text-blue-600 font-bold bg-blue-50",
                  isSelected && "bg-black text-white hover:bg-gray-800 shadow-md transform scale-105 font-medium"
                )}
              >
                {format(day, "d")}
                {isTodayDate && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonths = () => {
    return (
      <div className="grid grid-cols-3 gap-2 py-2 animate-in fade-in zoom-in-95 duration-200">
        {MONTHS.map((month, idx) => {
            const isSelectedMonth = currentDate.getMonth() === idx;
            return (
                <button
                    key={month}
                    onClick={() => handleMonthSelect(idx)}
                    className={cn(
                    "px-2 py-3 text-sm rounded-md transition-all",
                    isSelectedMonth
                        ? "bg-black text-white shadow-sm font-medium" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                >
                    {month}
                </button>
            )
        })}
      </div>
    );
  };

  const renderYears = () => {
    const currentYear = currentDate.getFullYear();
    const startYear = currentYear - 6;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="grid grid-cols-3 gap-2 py-2 animate-in fade-in zoom-in-95 duration-200">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearSelect(year)}
            className={cn(
              "px-2 py-3 text-sm rounded-md transition-all",
              year === currentYear
                ? "bg-black text-white shadow-sm font-medium"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("p-3 bg-white border rounded-lg shadow-sm", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handlePrev} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-black"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex justify-center">
          {renderHeader()}
        </div>

        <button 
          onClick={handleNext} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-black"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar Content */}
      <div className="min-h-[240px]">
        {view === "days" && renderDays()}
        {view === "months" && renderMonths()}
        {view === "years" && renderYears()}
      </div>

      {/* Today Button */}
      {view === "days" && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
          <button 
            onClick={() => { 
              const today = new Date();
              setCurrentDate(today); 
              actualOnChange(today);
            }}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
};
export { Calendar };
export default Calendar;