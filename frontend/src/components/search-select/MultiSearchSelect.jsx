import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function MultiSearchSelect({
  label,
  icon,
  options = [],
  selected = [],
  setSelected,
  placeholder = "Search...",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );

  const addItem = (value) => {
    const trimmed = value.trim();

    if (!trimmed) return;

    const exists = selected.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );

    if (exists) return;

    setSelected([...selected, trimmed]);

    setQuery("");
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <Label className="flex items-center gap-2 text-slate-700 font-semibold">
        {icon}
        {label}
      </Label>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1 bg-white focus-within:border-[#f26522] focus-within:ring-1 focus-within:ring-[#f26522]">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 rounded-full bg-[#f26522]/10 text-[#555555] px-2 py-0.5 font-medium"
            >
              {item}

              <button
                type="button"
                className="text-slate-500 hover:text-red-500"
                onClick={() =>
                  setSelected(selected.filter((tag) => tag !== item))
                }
              >
                <X size={12} />
              </button>
            </Badge>
          ))}

          <Input
            value={query}
            placeholder={selected.length > 0 ? "" : placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(query);
              }
            }}
            className="h-7 flex-1 border-0 p-0 text-xs focus-visible:ring-0 bg-transparent shadow-none"
          />
        </div>

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="max-h-44 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No tags found. Press Enter to add new tag.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex w-full justify-start px-3 py-2 text-xs hover:bg-slate-50"
                    onClick={() => {
                      addItem(option);
                      setOpen(false);
                    }}
                  >
                    {option}
                  </Button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
