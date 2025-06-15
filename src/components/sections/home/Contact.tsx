import type { FC } from 'react'
import { Mail, Phone } from 'lucide-react'

const Contact: FC = () => (
  <section
    id="contacto"
    className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20"
  >
    <div className="container mx-auto px-4">
      <header className="mb-12 text-center">
        <h2 className="text-base font-semibold uppercase text-primary-600">
          Contacto
        </h2>
        <p className="mt-2 text-3xl font-bold text-gray-900">
          ¿Listo para comenzar?
        </p>
        <p className="mx-auto mt-4 max-w-xl text-secondary-600">
          Agenda una reunión sin costo o envíanos tus dudas. Respondemos &lt;
          24 h.
        </p>
      </header>

      <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
        {/* --- Email --- */}
        <a
          href="mailto:contacto@stegmaierconsulting.cl"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-soft transition hover:shadow-hover"
        >
          <span className="rounded-lg bg-primary-50 p-3 text-primary-700">
            <Mail className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              contacto@stegmaierconsulting.cl
            </h3>
            <p className="text-sm text-secondary-600">Escríbenos un correo</p>
          </div>
        </a>

        {/* --- WhatsApp / Tel --- */}
        <a
          href="https://wa.me/56223456789"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-soft transition hover:shadow-hover"
        >
          <span className="rounded-lg bg-green-50 p-3 text-green-700">
            <Phone className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              +56 2 2345 6789
            </h3>
            <p className="text-sm text-secondary-600">WhatsApp / Teléfono</p>
          </div>
        </a>
      </div>
    </div>
  </section>
)

export default Contact
