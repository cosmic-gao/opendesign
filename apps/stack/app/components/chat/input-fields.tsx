import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { PencilIcon } from "lucide-react";

interface InputFieldsProps {
  inputs: string[];
  onApply: (inputValues: Record<string, string>) => void;
}

export function InputFields({ inputs, onApply }: InputFieldsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [allInputsFilled, setAllInputsFilled] = useState(false);

  useEffect(() => {
    const filled = inputs.every((input) => inputValues[input]?.trim());
    setAllInputsFilled(filled);
  }, [inputValues, inputs]);

  const handleInputChange = (input: string, newValue: string) => {
    setInputValues((prev) => ({ ...prev, [input]: newValue }));
  };

  const applyInputs = () => {
    onApply(inputValues);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="relative">
          <PencilIcon className="w-4 h-4 mr-2" />
          Inputs ({inputs.length})
          {!allInputsFilled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
          {allInputsFilled && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]">
        <div className="space-y-4">
          <h3 className="font-semibold">Fill Input Fields</h3>
          {inputs.map((input, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`input-${index}`}>
                {input.replace(/[{}]/g, "")}
              </Label>
              <Input
                id={`input-${index}`}
                value={inputValues[input] || ""}
                onChange={(e) => handleInputChange(input, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyInputs();
                  }
                }}
              />
            </div>
          ))}
          <Button onClick={applyInputs}>Apply Inputs</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
