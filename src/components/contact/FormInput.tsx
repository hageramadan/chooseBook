// components/contact/FormInput.tsx
interface FormInputProps {
  label: string;
  name: string;
  type: "text" | "email" | "tel" | "textarea";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export default function FormInput({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
}: FormInputProps) {
  const baseClassName = "w-full px-4 py-3 border border-gray-200  rounded-[8px]  focus:border-[#23A6F0] focus:outline-none focus:ring-1 focus:ring-[#23A6F0] transition bg-white";
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-[#f02323]">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClassName} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={baseClassName}
        />
      )}
    </div>
  );
}