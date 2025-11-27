/**
 * CreateTenantModal Component
 * Modal para crear nuevos tenants (solo superadmin)
 * Incluye validación y preview del database name
 */

import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { X, Building2, Database, AlertCircle } from 'lucide-react';
import tenantService from '../../services/tenantService';
import { CreateTenantDTO } from '../../types/tenant';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Alert } from '@/components/ui/alert';

interface CreateTenantModalProps {
  onClose: () => void;
  onSuccess: (tenant: any) => void;
}

// Validación con Yup
const TenantSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('Nombre requerido'),
  slug: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .matches(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
    .required('Slug requerido'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email requerido'),
  phone: Yup.string()
    .min(9, 'Mínimo 9 caracteres')
    .max(15, 'Máximo 15 caracteres')
    .required('Teléfono requerido'),
  description: Yup.string()
    .max(500, 'Máximo 500 caracteres'),
  address: Yup.string()
    .max(200, 'Máximo 200 caracteres'),
  website: Yup.string()
    .url('URL inválida (debe incluir https://)')
    .nullable()
});

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [error, setError] = useState<string | null>(null);
  const [previewDbName, setPreviewDbName] = useState<string>('');

  // Manejar submit
  const handleSubmit = async (
    values: CreateTenantDTO,
    { setSubmitting }: any
  ) => {
    try {
      setError(null);

      // Crear tenant usando el nuevo método para usuarios regulares
      const newTenant = await tenantService.createUserTenant(values);

      // Notificar éxito con el tenant creado
      onSuccess(newTenant);
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear organización';
      setError(errorMsg);
      console.error('Error creating tenant:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                  Crear Nuevo Tenant
                </h3>
                <p className="text-sm text-gray-500">
                  Agrega una nueva organización al sistema
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4">
              <Alert
                type="error"
                message={error}
                onClose={() => setError(null)}
              />
            </div>
          )}

          {/* Form */}
          <Formik
            initialValues={{
              name: '',
              slug: '',
              email: '',
              phone: '',
              description: '',
              address: '',
              website: ''
            }}
            validationSchema={TenantSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, isSubmitting, errors, touched, setFieldValue }) => {
              // Auto-generar slug cuando cambia el nombre
              useEffect(() => {
                if (values.name && (!values.slug || !touched.slug)) {
                  const generatedSlug = tenantService.generateSlug(values.name);
                  setFieldValue('slug', generatedSlug);
                }
              }, [values.name]);

              // Actualizar preview del database name
              useEffect(() => {
                if (values.slug) {
                  setPreviewDbName(tenantService.previewDatabaseName(values.slug));
                }
              }, [values.slug]);

              return (
                <Form className="space-y-5">
                  {/* Nombre del Tenant */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Tenant
                    </label>
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      placeholder="ej: Acme Corporation"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.name && touched.name ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      El nombre completo de la organización
                    </p>
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (Identificador único)
                    </label>
                    <Field
                      id="slug"
                      name="slug"
                      type="text"
                      placeholder="ej: acme-corp"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm
                        ${errors.slug && touched.slug ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="slug"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Solo letras minúsculas, números y guiones. Se auto-genera desde el nombre.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email de Contacto *
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ej: contact@acme-corp.com"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.email && touched.email ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email principal de contacto de la organización
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <Field
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="ej: +56912345678"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.phone && touched.phone ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="phone"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Número de teléfono de contacto (9-15 dígitos)
                    </p>
                  </div>

                  {/* Description (opcional) */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <Field
                      id="description"
                      name="description"
                      as="textarea"
                      rows={3}
                      placeholder="ej: Empresa dedicada a..."
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
                        ${errors.description && touched.description ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Breve descripción de la organización (máximo 500 caracteres)
                    </p>
                  </div>

                  {/* Address (opcional) */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección (opcional)
                    </label>
                    <Field
                      id="address"
                      name="address"
                      type="text"
                      placeholder="ej: Av. Principal 123, Ciudad"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.address && touched.address ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="address"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Dirección física de la organización
                    </p>
                  </div>

                  {/* Website (opcional) */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio Web (opcional)
                    </label>
                    <Field
                      id="website"
                      name="website"
                      type="url"
                      placeholder="ej: https://www.acme-corp.com"
                      className={`
                        w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.website && touched.website ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <ErrorMessage
                      name="website"
                      component="div"
                      className="mt-1 text-sm text-red-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      URL del sitio web (debe incluir https://)
                    </p>
                  </div>

                  {/* Database Name Preview */}
                  {previewDbName && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Database className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">
                            Base de datos:
                          </p>
                          <p className="text-sm font-mono text-gray-900 break-all mt-1">
                            {previewDbName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Important Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Importante
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          El slug no puede ser modificado después de crear el tenant. Asegúrate de que sea correcto.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || Object.keys(errors).length > 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>Crear Tenant</span>
                        </>
                      )}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreateTenantModal;
