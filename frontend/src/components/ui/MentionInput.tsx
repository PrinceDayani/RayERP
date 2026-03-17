"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "./textarea";
import { Card } from "./card";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  users: User[];
  placeholder?: string;
  rows?: number;
}

export function MentionInput({ value, onChange, users, placeholder, rows = 3 }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]);
    }
    return mentions;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    setCursorPosition(position);

    const textBeforeCursor = newValue.substring(0, position);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbol !== -1 && lastAtSymbol === position - 1) {
      setSuggestions(users);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else if (lastAtSymbol !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtSymbol + 1).toLowerCase();
      const filtered = users.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm) ||
          u.firstName.toLowerCase().includes(searchTerm) ||
          u.lastName.toLowerCase().includes(searchTerm)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    const beforeMention = value.substring(0, lastAtSymbol);
    const mention = `@[${user.firstName} ${user.lastName}](${user._id})`;
    const newValue = beforeMention + mention + " " + textAfterCursor;

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeMention.length + mention.length + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const displayValue = value.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user._id}
              className={`w-full text-left px-4 py-2 hover:bg-accent ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
              onClick={() => insertMention(user)}
            >
              {user.firstName} {user.lastName}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
