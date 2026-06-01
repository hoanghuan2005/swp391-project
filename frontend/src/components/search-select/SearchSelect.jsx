import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function SearchSelect({
  label,
  icon,
  placeholder,
  options = [],
  value,
  setValue,
  onSelect,
  onInputChange,
  displayValue,
  renderLeft,
  renderRight,
  searchKeys = [],
}) {
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

  const filteredOptions = options.filter((item) => {
    const query = value.trim().toLowerCase();

    if (!query) return true;

    return searchKeys.some((key) =>
      item[key]?.toString().toLowerCase().includes(query),
    );
  });

  return (
    <div className="space-y-1" ref={containerRef}>
      <Label className="flex items-center gap-2 text-slate-700 font-semibold">
        {icon}
        {label}
      </Label>

      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const inputValue = e.target.value;

            setValue(inputValue);

            onInputChange?.(inputValue);

            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");

              onSelect?.(null);

              onInputChange?.("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No data found
                </div>
              ) : (
                filteredOptions.map((item) => (
                  <Button
                    key={item.id || item.code}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                    onClick={() => {
                      onSelect?.(item);

                      setValue(displayValue(item));

                      setOpen(false);
                    }}
                  >
                    <div>{renderLeft ? renderLeft(item) : item.name}</div>

                    <div>{renderRight ? renderRight(item) : null}</div>
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
