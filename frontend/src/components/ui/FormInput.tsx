import React from 'react';
import { useField } from 'formik';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
}

/**
 * Componente de entrada de formulario con integración de Formik
 * Incluye manejo de errores y estado de validación
 */
const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  required = false, 
  className = '', 
  ...props 
}) => {
  // Usar hook de Formik para conectar con el estado del formulario
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={props.name} 
        className="block text-sm font-medium mb-2 text-gray-700"
      >
        {label} {required && <span className="text-primary-600">*</span>}
      </label>
      
      <div className="relative">
        <input
          {...field}
          {...props}
          id={props.name}
          className={`
            w-full px-4 py-3 rounded-md border 
            ${hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring focus:ring-red-200' 
              : 'border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200'
            }
            focus:outline-none transition duration-200
            ${className}
          `}
        />
      </div>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{meta.error}</p>
      )}
    </div>
  );
};

export default FormInput;
